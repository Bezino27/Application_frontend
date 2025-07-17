import React, { useContext, useState } from "react";
import { SafeAreaView, StyleSheet, ScrollView, Text, View, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../hooks/api";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userDetails, accessToken, setUserDetails } = useContext(AuthContext);

  const [username, setuserName] = useState(userDetails?.username || "");
  const [email, setEmail] = useState(userDetails?.email || "");
  const [email2, setEmail2] = useState(userDetails?.email_2 || "");
  const [birthDate, setBirthDate] = useState(userDetails?.birth_date || "");
  const [height, setHeight] = useState(userDetails?.height || "");
  const [weight, setWeight] = useState(userDetails?.weight || "");
  const [side, setSide] = useState(userDetails?.side || "");
  const [number, setNumber] = useState(userDetails?.number || "");

  const handleSave = async () => {
    try {
      const res = await fetch(`${BASE_URL}/me/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username,
          email,
          email_2: email2,
          birth_date: birthDate,
          height,
          weight,
          side,
          number,
        }),
      });

      if (!res.ok) throw new Error("Nepodarilo sa uložiť údaje");

      const refreshedRes = await fetch(`${BASE_URL}/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!refreshedRes.ok) throw new Error("Nepodarilo sa načítať nové údaje");

      const freshUserData = await refreshedRes.json();
      setUserDetails(freshUserData);

      Alert.alert("Úspech", "Údaje boli uložené");
      router.back();
    } catch (e) {
      Alert.alert("Chyba", "Skontroluj údaje alebo spojenie");
      console.error(e);
    }
  };

return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Úprava profilu</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Používateľské meno</Text>
        <TextInput value={username} onChangeText={setuserName} style={styles.input} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Alternatívny email</Text>
        <TextInput value={email2} onChangeText={setEmail2} style={styles.input} keyboardType="email-address" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Dátum narodenia</Text>
        <TextInput value={birthDate} onChangeText={setBirthDate} style={styles.input} placeholder="RRRR-MM-DD" />
      </View>

      <View style={styles.inlineFields}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Výška (cm)</Text>
          <TextInput value={height} onChangeText={setHeight} style={styles.input} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Váha (kg)</Text>
          <TextInput value={weight} onChangeText={setWeight} style={styles.input} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Strana držania hokejky</Text>
        <TextInput value={side} onChangeText={setSide} style={styles.input} placeholder="ľavá / pravá" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Číslo na drese</Text>
        <TextInput value={number} onChangeText={setNumber} style={styles.input} keyboardType="numeric" />
      </View>

      <View style={styles.buttonWrapper}>
        <Button title="💾 Uložiť" onPress={handleSave} color="#007AFF" />
      </View>
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  field: {
    marginBottom: 16,
  },
  inlineFields: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  buttonWrapper: {
    marginTop: 24,
  },
  safeArea: {
  flex: 1,
  backgroundColor: "#f9f9f9",
  },

});