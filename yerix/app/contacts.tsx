import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAppState } from "@/state/store";
import { getContacts, addContact, deleteContact, type Contact } from "@/services/api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ContactRow } from "@/components/ContactRow";
import { DEV_USER_ID, MAX_CONTACTS } from "@/constants";

const E164 = /^\+[1-9]\d{1,14}$/;

export default function ContactsScreen() {
  const { dispatch } = useAppState();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setContacts(await getContacts(DEV_USER_ID));
    } catch (e) {
      Alert.alert("Error", String((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    if (!E164.test(phone)) {
      Alert.alert("Invalid phone", "Use E.164 format, e.g. +15551234567");
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert("Limit reached", `Maximum ${MAX_CONTACTS} contacts`);
      return;
    }
    setLoading(true);
    try {
      const c = await addContact(DEV_USER_ID, name.trim(), phone);
      setContacts([...contacts, c]);
      setName("");
      setPhone("");
    } catch (e) {
      Alert.alert("Error", String((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteContact(DEV_USER_ID, id);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch (e) {
      Alert.alert("Error", String((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.subtitle}>Max {MAX_CONTACTS} contacts. SMS and call alerts go to every contact.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="+15551234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Button onPress={handleAdd} disabled={loading}>
              Add
            </Button>
          </View>
        </Card>

        <Text style={styles.section}>Contacts</Text>
        {contacts.length === 0 ? (
          <Text style={styles.empty}>No contacts added yet.</Text>
        ) : (
          contacts.map((c) => (
            <ContactRow key={c.id} name={c.name} phone={c.phone} onDelete={() => handleDelete(c.id)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14 },
  card: { width: "100%", padding: 18, gap: 10 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 10 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#111827" },
  section: { alignSelf: "stretch", fontSize: 14, fontWeight: "600", color: "#6b7280", marginTop: 6 },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 20 },
});
