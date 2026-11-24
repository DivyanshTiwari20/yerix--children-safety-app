import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { addContact, deleteContact, getContacts, type Contact } from "@/services/api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ContactRow } from "@/components/ContactRow";
import { MAX_CONTACTS } from "@/constants";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export default function ContactsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setContacts(await getContacts());
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    const nationalNumber = phone.replace(/\D/g, "");
    if (!INDIAN_MOBILE.test(nationalNumber)) {
      Alert.alert("Invalid phone", "Enter a 10-digit Indian mobile number.");
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert("Limit reached", `Maximum ${MAX_CONTACTS} contacts`);
      return;
    }
    setLoading(true);
    try {
      const contact = await addContact(name.trim(), `+91${nationalNumber}`);
      setContacts([...contacts, contact]);
      setName("");
      setPhone("");
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteContact(id);
      setContacts(contacts.filter((contact) => contact.id !== id));
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {contacts.length} / {MAX_CONTACTS} contacts
          </Text>
        </View>

        {contacts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.blueTint }]}>
              <SymbolView
                name={{ ios: "person.2.fill", android: "people", web: "people" }}
                tintColor={colors.primary}
                size={24}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No emergency contacts yet.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {contacts.map((contact, index) => (
              <ContactRow
                key={contact.id}
                name={contact.name}
                phone={contact.phone}
                onDelete={() => handleDelete(contact.id)}
                last={index === contacts.length - 1}
              />
            ))}
          </Card>
        )}

        {contacts.length < MAX_CONTACTS && (
          <Button
            onPress={() => setShowForm((visible) => !visible)}
            style={styles.addButton}
          >
            {showForm ? "Close form" : "Add contact"}
          </Button>
        )}

        {showForm && contacts.length < MAX_CONTACTS && (
          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.text }]}>New contact</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <View style={[styles.phoneField, { backgroundColor: colors.background }]}>
              <Text style={[styles.countryCode, { color: colors.text }]}>+91</Text>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Text style={[styles.phoneHint, { color: colors.textSecondary }]}>
              We&apos;ll add +91 when saving.
            </Text>
            <Button onPress={handleAdd} disabled={loading} style={styles.addButton}>
              {loading ? "Saving..." : "Save contact"}
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.screen, gap: Spacing.section },
  heading: { gap: Spacing.one },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  listCard: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  emptyCard: { minHeight: 140, alignItems: "center", justifyContent: "center", gap: Spacing.two },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14 },
  addButton: { width: "100%", height: 52 },
  formCard: { gap: Spacing.two },
  formTitle: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.one },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    backgroundColor: "#F3F5F9",
  },
  phoneField: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  countryCode: { fontSize: 15, fontWeight: "600" },
  phoneInput: { flex: 1, height: 52, fontSize: 15 },
  phoneHint: { fontSize: 12, marginTop: -Spacing.one },
});
