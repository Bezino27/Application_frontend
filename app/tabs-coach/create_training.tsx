// create_training.tsx

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
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
  const { userClub } = useContext(AuthContext);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [date, setDate] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

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

      const dateToSend = new Date(date);
      dateToSend.setSeconds(0, 0);

      const isoDate = dateToSend.toISOString();

      const res = await fetchWithAuth(`${BASE_URL}/trainings/`, {
        method: "POST",
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

  const handleDateTimeChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      selectedDate.setSeconds(0, 0);
      setDate(selectedDate);
    }
  };

  return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Vytvoriť tréning</Text>

        <Text style={styles.label}>Kategória:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
              selectedValue={categoryId}
              onValueChange={(value) => setCategoryId(value)}
              dropdownIconColor="#000"
              style={{ color: "#000" }}
              itemStyle={{ color: "#000" }}
          >
            <Picker.Item label="Vyber kategóriu..." value={null} color="#000" />
            {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} color="#000" />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Popis tréningu:</Text>
        <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="napr. Kondičný tréning"
            placeholderTextColor="#888"
        />

        <Text style={styles.label}>Miesto:</Text>
        <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="napr. Hala ATU"
            placeholderTextColor="#888"
        />

        <Text style={styles.label}>Dátum a čas:</Text>
        <TouchableOpacity
            onPress={() => setShowDateTimePicker(!showDateTimePicker)}
            style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            Vybrať: {date.toLocaleDateString("sk-SK")} {date.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </TouchableOpacity>

        {showDateTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                  value={date}
                  mode="datetime"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  textColor="#000"
                  themeVariant="light"
                  onChange={(event, selectedDate) => {
                    handleDateTimeChange(event, selectedDate);
                  }}
                  style={{ backgroundColor: Platform.OS === "ios" ? "#fff" : undefined }}
              />
            </View>
        )}

        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Vytvoriť tréning</Text>
        </TouchableOpacity>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 20,
    color: "#111",
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
    color: "#333",
  },
  pickerWrapper: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    color: "#111",
  },
  dateButton: {
    backgroundColor: "#4c68d7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 5,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
