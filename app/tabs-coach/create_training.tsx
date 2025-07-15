import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext"; // podľa tvojej štruktúry
import { BASE_URL } from "@/hooks/api";

const CreateTrainingScreen = () => {
  const router = useRouter();
  const { accessToken, userClub } = useContext(AuthContext);

  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const handleCreate = async () => {
    if (!categoryId || !date || !location) {
      Alert.alert("Chyba", "Vyplň všetky povinné polia (kategória, dátum, miesto).");
      return;
    }

    if (!accessToken || !userClub) {
      Alert.alert("Chyba", "Nie ste prihlásený alebo nemáte nastavený klub.");
      return;
    }

    try {
const response = await fetch(
  `http://127.0.0.1:8000/api/clubs/${userClub.id}/trainings/create/`,
  {
    method: "POST",
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
},
    body: JSON.stringify({
      category: categoryId,  // sem patrí categoryId
      date,
      location,
      description,
    }),
  }
);

      if (response.ok) {
        const createdTraining = await response.json();
        Alert.alert("Úspech", "Tréning bol vytvorený!");
        router.back();
      } else {
        const error = await response.json();
        console.error(error);
        Alert.alert("Chyba", error.detail || "Nepodarilo sa vytvoriť tréning");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa spojiť so serverom");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dátum (YYYY-MM-DDTHH:MM):</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2025-06-26T18:00"
      />

      <Text style={styles.label}>Miesto:</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Telocvičňa ZŠ..."
      />

      <Text style={styles.label}>Popis (nepovinné):</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Tréning techniky..."
      />

      <Text style={styles.label}>ID kategórie:</Text>
      <TextInput
        style={styles.input}
        value={categoryId}
        onChangeText={setCategoryId}
        placeholder="1"
        keyboardType="numeric"
      />

      <Button title="Vytvoriť tréning" onPress={handleCreate} />
    </View>
  );
};

export default CreateTrainingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { marginTop: 15, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  },
});