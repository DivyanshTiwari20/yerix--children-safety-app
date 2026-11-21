import { Linking } from "react-native";

export async function openWhatsApp(phoneDigits: string, message: string): Promise<void> {
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error("WhatsApp is not available");
  await Linking.openURL(url);
}
