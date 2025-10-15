import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { BASE_URL } from "@/hooks/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Chyba", "Zadaj email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/password_reset/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.multiple) {
        // viac účtov → ponúkni výber
        setAccounts(data.accounts);
      } else if (res.ok) {
        Alert.alert("✅ Over si email", "Na tvoj email bol odoslaný odkaz na reset hesla.");
        router.back();
      } else {
        Alert.alert("Chyba", data.detail || "Nepodarilo sa odoslať email.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Chyba", "Skús to znova neskôr.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (userId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/password_reset/generate_for_user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("✅ Over si email", "Na tvoj email bol odoslaný odkaz pre vybraný účet.");
        router.back();
      } else {
        Alert.alert("Chyba", data.detail || "Nepodarilo sa vygenerovať reset link.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Chyba", "Skús to znova neskôr.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Obnova hesla</Text>
      <TextInput
        style={styles.input}
        placeholder="Zadaj email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Odosielam..." : "Odoslať"}</Text>
      </TouchableOpacity>

      {accounts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ marginBottom: 10, textAlign: "center" }}>
            Na tento email je priradených viac účtov. Vyber, pre ktorý chceš resetovať heslo:
          </Text>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              onPress={() => handleSelectAccount(acc.id)}
              style={[styles.button, { backgroundColor: "#555", marginBottom: 10 }]}
            >
              <Text style={styles.buttonText}>{acc.full_name || acc.username}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: "#D32F2F", padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
