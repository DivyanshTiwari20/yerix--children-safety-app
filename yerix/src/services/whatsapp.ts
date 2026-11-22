import { Linking } from "react-native";

export async function openWhatsApp(phoneDigits: string, message: string): Promise<void> {
  const normalizedPhone = phoneDigits.replace(/\D/g, "");
  if (!normalizedPhone) throw new Error("Contact phone number is invalid");
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error("WhatsApp is not available");
  await Linking.openURL(url);
}
