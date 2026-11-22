import { API_URL } from "@/constants";

export type Contact = { id: string; user_id: string; name: string; phone: string; created_at: string };
export type Settings = { alert_message: string; sensitivity: number; phrases: Record<string, boolean> };
export type Emergency = { id: string; user_id: string; trigger: string; status: string; created_at: string; ended_at: string | null };

export async function getContacts(userId: string): Promise<Contact[]> {
  const res = await fetch(`${API_URL}/api/contacts`, { headers: { "x-user-id": userId } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown };
    const message = typeof body.error === "string" ? body.error : `failed to load contacts (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function addContact(userId: string, name: string, phone: string): Promise<Contact> {
  const res = await fetch(`${API_URL}/api/contacts`, {
    method: "POST",
    headers: { "x-user-id": userId, "content-type": "application/json" },
    body: JSON.stringify({ name, phone }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: unknown };
    const message = typeof body.error === "string" ? body.error : `failed to add contact (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function deleteContact(userId: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/contacts/${id}`, { method: "DELETE", headers: { "x-user-id": userId } });
  if (!res.ok) throw new Error("failed to delete contact");
}

export async function getSettings(userId: string): Promise<Settings> {
  const res = await fetch(`${API_URL}/api/settings`, { headers: { "x-user-id": userId } });
  if (!res.ok) throw new Error("failed to load settings");
  return res.json();
}

export async function putSettings(userId: string, body: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "PUT",
    headers: { "x-user-id": userId, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("failed to save settings");
  return res.json();
}

export async function startEmergencyApi(
  userId: string,
  trigger: string,
  lat: number | null,
  lng: number | null
): Promise<{ id: string; trackUrl: string }> {
  const res = await fetch(`${API_URL}/api/emergencies`, {
    method: "POST",
    headers: { "x-user-id": userId, "content-type": "application/json" },
    body: JSON.stringify({ trigger, lat, lng }),
  });
  if (!res.ok) throw new Error("failed to start emergency");
  return res.json();
}

export async function postLocation(emergencyId: string, lat: number, lng: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/emergencies/${emergencyId}/location`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });
  if (!res.ok) throw new Error("failed to post location");
}

export async function cancelEmergencyApi(emergencyId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/emergencies/${emergencyId}/cancel`, { method: "POST", headers: { "x-user-id": userId } });
  if (!res.ok) throw new Error("failed to cancel");
}

export async function endEmergencyApi(emergencyId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/emergencies/${emergencyId}/end`, { method: "POST", headers: { "x-user-id": userId } });
  if (!res.ok) throw new Error("failed to end");
}

export async function getTrack(emergencyId: string) {
  const res = await fetch(`${API_URL}/api/track/${emergencyId}`);
  if (!res.ok) throw new Error("failed to load track");
  return res.json();
}
