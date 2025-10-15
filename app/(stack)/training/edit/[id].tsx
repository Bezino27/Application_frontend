import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BASE_URL } from "@/hooks/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Android pickery
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadTraining = async () => {
      try {
        const token = await AsyncStorage.getItem("access");
        const res = await fetch(`${BASE_URL}/training-detail/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDescription(data.description || "");
        setLocation(data.location || "");
        setDate(new Date(data.date));
      } catch (err) {
        Alert.alert("Chyba", "Nepodarilo sa načítať tréning.");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadTraining();
  }, [id]);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("access");
      const res = await fetch(`${BASE_URL}/trainings/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          location,
          date: date.toISOString(),
        }),
      });

      if (!res.ok) throw new Error();
      Alert.alert("✅ Upravené", "Tréning bol upravený.");
      router.replace("/tabs-coach/news");
    } catch {
      Alert.alert("Chyba", "Nepodarilo sa uložiť zmeny.");
    }
  };

  if (loading) return <Text style={{ padding: 20, color: "#111" }}>Načítavam...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Popis</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Popis tréningu"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Miesto</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Miesto tréningu"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Dátum a čas</Text>

      {Platform.OS === "ios" ? (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 10,
            marginVertical: 10,
          }}
        >
          <DateTimePicker
            value={date}
            mode="datetime"
            display="spinner"
            themeVariant="light" // 👈 toto zabezpečí svetlý vzhľad aj pri dark mode
            textColor="#000" // 👈 text bude čierny
            onChange={(_, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
            }}
            style={{ height: 200 }}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              📅 {date.toLocaleDateString("sk-SK")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              ⏰{" "}
              {date.toLocaleTimeString("sk-SK", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="calendar"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const newDate = new Date(date);
                  newDate.setFullYear(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate()
                  );
                  setDate(newDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="clock"
              onChange={(_, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  const newDate = new Date(date);
                  newDate.setHours(selectedDate.getHours());
                  newDate.setMinutes(selectedDate.getMinutes());
                  setDate(newDate);
                }
              }}
            />
          )}
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Uložiť zmeny</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { marginTop: 20, fontWeight: "bold", fontSize: 16, color: "#111" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#f9f9f9",
  },
  pickerButton: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pickerButtonText: { fontSize: 16, color: "#111", fontWeight: "500" },
  saveButton: {
    backgroundColor: "#D32F2F",
    padding: 15,
    marginTop: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
