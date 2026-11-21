import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const DEV_USER_ID = "dev-user-1";
const PORT = Number(process.env.PORT) || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

const E164 = /^\+[1-9]\d{1,14}$/;
const MAX_CONTACTS = 5;
const ALLOWED_TRIGGERS = ["voice", "sos", "shake", "test"];

const dryRun = !(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_KEY ?? "");
const twilioClient = dryRun ? null : twilio(TWILIO_ACCOUNT_SID as string, TWILIO_AUTH_TOKEN as string);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const header = req.header("x-user-id");
  req.userId = Array.isArray(header) ? header[0] : (header || DEV_USER_ID);
  next();
});

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ ok: true });
});

app.get("/api/contacts", async (req: express.Request, res: express.Response) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

app.post("/api/contacts", async (req: express.Request, res: express.Response) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  if (!name || !phone) {
    return res.status(400).json({ error: "name and phone are required" });
  }
  if (!E164.test(phone)) {
    return res.status(400).json({ error: "phone must be E.164" });
  }
  const { count, error: countError } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", req.userId);
  if (countError) return res.status(500).json({ error: countError.message });
  if ((count ?? 0) >= MAX_CONTACTS) {
    return res.status(400).json({ error: "maximum number of contacts reached" });
  }
  const { data, error } = await supabase
    .from("contacts")
    .insert({ user_id: req.userId, name, phone })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete("/api/contacts/:id", async (req: express.Request, res: express.Response) => {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get("/api/settings", async (req: express.Request, res: express.Response) => {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", req.userId)
    .single();
  if (error) {
    return res.json({
      alert_message: "I need help. Here is my live location:",
      sensitivity: 5,
      phrases: { yerix: true, "help me": true, "save me": true },
    });
  }
  res.json(data);
});

app.put("/api/settings", async (req: express.Request, res: express.Response) => {
  const { alert_message, sensitivity, phrases } = req.body as {
    alert_message?: string;
    sensitivity?: number;
    phrases?: Record<string, boolean>;
  };
  const { data, error } = await supabase
    .from("settings")
    .upsert({ user_id: req.userId, alert_message, sensitivity, phrases })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

async function notifyContacts(userId: string, trackUrl: string): Promise<void> {
  const { data: contacts } = await supabase
    .from("contacts")
    .select("name, phone")
    .eq("user_id", userId);
  const { data: settings } = await supabase
    .from("settings")
    .select("alert_message")
    .eq("user_id", userId)
    .single();
  const alertMessage = settings?.alert_message || "I need help. Here is my live location:";
  for (const contact of contacts ?? []) {
    const body = `${alertMessage} ${trackUrl}`;
    const twiml = `<Response><Say voice="alice">Emergency alert. ${contact.name} needs help. A tracking link was sent by text message.</Say></Response>`;
    if (dryRun) {
      console.log("[dry-run] SMS to", contact.phone, ":", body);
      console.log("[dry-run] Call to", contact.phone, ":", twiml);
      continue;
    }
    try {
      await twilioClient!.messages.create({
        body,
        from: TWILIO_FROM_NUMBER as string,
        to: contact.phone,
      });
    } catch (err) {
      console.error("sms error", err);
    }
    try {
      await twilioClient!.calls.create({
        twiml,
        to: contact.phone,
        from: TWILIO_FROM_NUMBER as string,
      });
    } catch (err) {
      console.error("call error", err);
    }
  }
}

app.post("/api/emergencies", async (req: express.Request, res: express.Response) => {
  const { trigger, lat, lng } = req.body as { trigger?: string; lat?: number; lng?: number };
  if (!trigger || !ALLOWED_TRIGGERS.includes(trigger)) {
    return res.status(400).json({ error: "invalid trigger" });
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng are required" });
  }
  const { data, error } = await supabase
    .from("emergencies")
    .insert({ user_id: req.userId, trigger, status: "active" })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await supabase.from("location_points").insert({ emergency_id: data.id, lat, lng });
  const trackUrl = `${PUBLIC_BASE_URL}/track/${data.id}`;
  if (trigger !== "test") {
    await notifyContacts(req.userId as string, trackUrl);
  } else {
    console.log("[test] would notify contacts:", trackUrl);
  }
  res.json({ id: data.id, trackUrl });
});

app.post("/api/emergencies/:id/location", async (req: express.Request, res: express.Response) => {
  const { lat, lng } = req.body as { lat?: number; lng?: number };
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng are required" });
  }
  await supabase.from("location_points").insert({ emergency_id: req.params.id, lat, lng });
  res.json({ ok: true });
});

app.post("/api/emergencies/:id/cancel", async (req: express.Request, res: express.Response) => {
  await supabase
    .from("emergencies")
    .update({ status: "cancelled", ended_at: new Date().toISOString() })
    .eq("id", req.params.id);
  res.json({ ok: true });
});

app.post("/api/emergencies/:id/end", async (req: express.Request, res: express.Response) => {
  await supabase
    .from("emergencies")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", req.params.id);
  res.json({ ok: true });
});

app.get("/api/track/:id", async (req: express.Request, res: express.Response) => {
  const { data: emergency } = await supabase
    .from("emergencies")
    .select("status, created_at, ended_at")
    .eq("id", req.params.id)
    .single();
  const { data: points } = await supabase
    .from("location_points")
    .select("lat, lng, created_at")
    .eq("emergency_id", req.params.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const latest = (points ?? [])[0];
  const path = (points ?? []).slice().reverse().map((p) => ({ lat: p.lat, lng: p.lng }));
  res.json({
    status: emergency?.status ?? null,
    lat: latest?.lat ?? null,
    lng: latest?.lng ?? null,
    updatedAt: latest?.created_at ?? emergency?.created_at ?? null,
    path,
  });
});

const trackHtml = (id: string) => `
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>YERIX Emergency Tracker</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; }
  body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; }
  #map { flex: 1; }
  .banner { padding: 8px 12px; background: #fee2e2; color: #991b1b; font-weight: 600; text-align: center; font-size: 14px; display: none; }
  .banner.show { display: block; }
</style>
<div class="banner" id="banner">Emergency ended</div>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map("map", { zoomControl: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  const marker = L.marker([0, 0]).addTo(map);
  const line = L.polyline([], { color: "#dc2626" }).addTo(map);
  const banner = document.getElementById("banner");
  async function poll() {
    try {
      const r = await fetch("/api/track/${id}");
      const j = await r.json();
      if (j.status !== "active") {
        banner?.classList.add("show");
        return;
      }
      if (j.lat != null && j.lng != null) {
        marker.setLatLng([j.lat, j.lng]);
        if (j.path && j.path.length) {
          line.setLatLngs(j.path.map((p) => [p.lat, p.lng]));
          map.fitBounds(line.getBounds(), { padding: [40, 40] });
        } else {
          map.setView([j.lat, j.lng], 15);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  poll();
  setInterval(poll, 5000);
</script>
</html>
`;

app.get("/track/:id", (_req: express.Request, res: express.Response) => {
  res.set("Content-Type", "text/html");
  res.send(trackHtml(_req.params.id as string));
});

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status ?? 500).json({ error: err.message ?? "internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`yerix-server listening on 0.0.0.0:${PORT} (dryRun=${dryRun})`);
});
