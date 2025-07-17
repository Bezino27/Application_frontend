import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { BASE_URL } from "@/hooks/api";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { AuthContext } from "@/context/AuthContext";


export default function CreateTrainingScreen() {
  const { fetchWithAuth } = useFetchWithAuth();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { userClub } = useContext(AuthContext);

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      if (!userClub?.id) return;

      const res = await fetchWithAuth(`${BASE_URL}/categories/${userClub.id}/`);
      if (!res.ok) throw new Error("Chyba pri načítaní kategórií");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("CHYBA PRI NAČÍTANÍ KATEGÓRIÍ:", err);
      Alert.alert("Chyba", "Nepodarilo sa načítať kategórie.");
    }
  };

  fetchCategories();
}, [userClub]);
  const handleSubmit = async () => {
    try {
      if (!description || !location || !categoryId) {
        Alert.alert("Chyba", "Vyplň všetky povinné polia");
        return;
      }

      const isoDate = date.toISOString();

      const res = await fetchWithAuth(`${BASE_URL}/trainings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          location,
          category: categoryId,
          date: isoDate,
        }),
      });

      if (!res.ok) throw new Error("Chyba pri vytváraní tréningu");

      Alert.alert("Úspech", "Tréning bol vytvorený");
      router.back();
    } catch (err) {
      console.error("CHYBA PRI VYTVORENÍ TRÉNINGU:", err);
      Alert.alert("Chyba", "Skontroluj údaje alebo spojenie.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 10 }}>
        Vytvoriť tréning
      </Text>

      <Text>Kategória:</Text>
      <View style={inputStyle}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(value) => setCategoryId(value)}
        >
          <Picker.Item label="Vyber kategóriu..." value={null} />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>
      </View>

      <Text>Popis tréningu:</Text>
      <TextInput
        style={inputStyle}
        value={description}
        onChangeText={setDescription}
        placeholder="napr. Kondičný tréning"
      />

      <Text>Miesto:</Text>
      <TextInput
        style={inputStyle}
        value={location}
        onChangeText={setLocation}
        placeholder="napr. Hala ATU"
      />

      <Text>Dátum a čas:</Text>
      <Button
        title={date.toLocaleString("sk-SK")}
        onPress={() => setShowPicker(true)}
      />

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Vytvoriť tréning" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: "#eee",
  marginBottom: 10,
  padding: 10,
  borderRadius: 5,
};