// app/(stack)/(tabs)/tabs-coach/create_training.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL } from "@/hooks/api";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";

type EventType = "training" | "match";

export default function CreateEventScreen() {
  const router = useRouter();
  const { userRoles, currentRole } = useContext(AuthContext);
  const { fetchWithAuth } = useFetchWithAuth();

  // ⭐ prepínač tréning / zápas
  const [eventType, setEventType] = useState<EventType>("training");

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState(""); // ⭐ len pre zápas

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [date, setDate] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false); // iOS inline
  const [submitting, setSubmitting] = useState(false);

  // návrhy z histórie
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [opponentSuggestions, setOpponentSuggestions] = useState<string[]>([]); // ⭐

  // --- kategórie z rolí trénera ---
  useEffect(() => {
    const coachCategories = userRoles
        .filter((r) => r.role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "coach")
        .map((r) => ({ id: r.category.id, name: r.category.name }));
    setCategories(coachCategories);
    if (coachCategories.length === 1) setSelectedCategories([coachCategories[0].id]);
  }, [userRoles]);

  // --- histórie (miesto, popis, súper) ---
  const loadPreferences = useCallback(async () => {
    try {
      const [locHist, descHist, oppHist] = await Promise.all([
        AsyncStorage.getItem("history_location"),
        AsyncStorage.getItem("history_description"),
        AsyncStorage.getItem("history_opponent"),
      ]);

      const loc = locHist ? JSON.parse(locHist) : [];
      const desc = descHist ? JSON.parse(descHist) : [];
      const opp = oppHist ? JSON.parse(oppHist) : [];

      setLocationSuggestions(Array.isArray(loc) ? loc : []);
      setDescriptionSuggestions(Array.isArray(desc) ? desc : []);
      setOpponentSuggestions(Array.isArray(opp) ? opp : []);
    } catch {
      setLocationSuggestions([]);
      setDescriptionSuggestions([]);
      setOpponentSuggestions([]);
    }
  }, []); // 👈 bez [location, description, opponent]

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updateHistory = async (key: string, value: string) => {
    const raw = await AsyncStorage.getItem(key);
    let items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) items = [];
    items = [value, ...items.filter((i: string) => i !== value)];
    if (items.length > 5) items = items.slice(0, 5);
    await AsyncStorage.setItem(key, JSON.stringify(items));
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  // ===== ANDROID pickery (komfort) =====
  const openAndroidTime = (base: Date) => {
    DateTimePickerAndroid.open({
      value: base,
      mode: "time",
      is24Hour: true,
      onChange: (event, selected) => {
        if (event.type === "set" && selected) {
          const next = new Date(base);
          next.setHours(selected.getHours());
          next.setMinutes(selected.getMinutes());
          next.setSeconds(0, 0);
          setDate(next);
        }
      },
    });
  };
  const openAndroidDate = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: "date",
      onChange: (event, selected) => {
        if (event.type === "set" && selected) {
          const next = new Date(date);
          next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
          setDate(next);
          openAndroidTime(next);
        }
      },
    });
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (submitting) return;

    // len tréner v tréner rozhraní
    const isCoach = currentRole?.role?.toLowerCase() === "coach";
    if (!isCoach) {
      Alert.alert("Nemáš oprávnenie vytvárať udalosti.");
      return;
    }

    try {
      if (selectedCategories.length === 0 && categories.length === 1) {
        setSelectedCategories([categories[0].id]);
      }

      if (!location || selectedCategories.length === 0) {
        Alert.alert("Chyba", "Vyplň všetky povinné polia.");
        return;
      }
      if (eventType === "match" && !opponent) {
        Alert.alert("Chyba", "Zadaj súpera.");
        return;
      }

      setSubmitting(true);

      const d = new Date(date);
      d.setSeconds(0, 0);
      const isoDate = d.toISOString();

      // ulož históriu
      await Promise.all([
        updateHistory("history_location", location),
        description ? updateHistory("history_description", description) : Promise.resolve(),
        eventType === "match" && opponent
            ? updateHistory("history_opponent", opponent)
            : Promise.resolve(),
      ]);

      // ⭐ endpointy + payload podľa módu
      const endpoint = eventType === "training" ? "/trainings/" : "/matches/create/";
      const payload =
          eventType === "training"
              ? {
                description,
                location,
                category_ids: selectedCategories,
                date: isoDate,
              }
              : {
                description,
                location,
                category_ids: selectedCategories,
                date: isoDate,
                opponent, // 👈 dôležité pre zápas
              };

      const res = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const raw = await res.text();
        let msg = raw;
        try {
          const j = JSON.parse(raw);
          msg = j?.detail || j?.message || raw;
        } catch {}
        throw new Error(`HTTP ${res.status} – ${msg}`);
      }

      Alert.alert("✅ Úspech", eventType === "training" ? "Tréning bol vytvorený." : "Zápas bol vytvorený.");
      router.back();
    } catch (err: any) {
      console.error("CHYBA PRI VYTVORENÍ UDALOSTI:", err);
      Alert.alert("Chyba", String(err?.message ?? "Skontroluj údaje alebo spojenie."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <SafeAreaView style={[styles.safeArea]} edges={["left", "right", "bottom"]}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* ⭐ prepínač tréning / zápas */}
          <View style={styles.switchRow}>
            {(["training", "match"] as EventType[]).map((t) => {
              const active = eventType === t;
              return (
                  <TouchableOpacity
                      key={t}
                      onPress={() => setEventType(t)}
                      style={[styles.switchBtn, active && styles.switchBtnActive]}
                      disabled={submitting}
                  >
                    <Text style={[styles.switchText, active && styles.switchTextActive]}>
                      {t === "training" ? "Tréning" : "Zápas"}
                    </Text>
                  </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Kategórie</Text>
            <View style={styles.suggestionRow}>
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleCategory(cat.id)}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, isSelected && { color: "#fff" }]}>{cat.name}</Text>
                    </TouchableOpacity>
                );
              })}
            </View>

            {/* Popis */}
            <Text style={styles.label}>Popis</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder={eventType === "training" ? "napr. Kondičný tréning" : "napr. Majstrovský zápas"}
                placeholderTextColor="#999"
            />
            {descriptionSuggestions.length > 0 && (
                <View style={styles.suggestionRow}>
                  {descriptionSuggestions.map((desc) => (
                      <SuggestionChip
                          key={desc}
                          label={desc}
                          onPick={() => setDescription(desc)}
                          onRemove={async () => {
                            const updated = descriptionSuggestions.filter((d) => d !== desc);
                            setDescriptionSuggestions(updated);
                            await AsyncStorage.setItem("history_description", JSON.stringify(updated));
                          }}
                      />
                  ))}
                </View>
            )}

            {/* ⭐ Súper – iba ak je typ „Zápas“ */}
            {eventType === "match" && (
                <>
                  <Text style={styles.label}>Súper</Text>
                  <TextInput
                      style={styles.input}
                      value={opponent}
                      onChangeText={setOpponent}
                      placeholder="napr. HK Košice U15"
                      placeholderTextColor="#999"
                  />
                  {opponentSuggestions.length > 0 && (
                      <View style={styles.suggestionRow}>
                        {opponentSuggestions.map((o) => (
                            <SuggestionChip
                                key={o}
                                label={o}
                                onPick={() => setOpponent(o)}
                                onRemove={async () => {
                                  const updated = opponentSuggestions.filter((x) => x !== o);
                                  setOpponentSuggestions(updated);
                                  await AsyncStorage.setItem("history_opponent", JSON.stringify(updated));
                                }}
                            />
                        ))}
                      </View>
                  )}
                </>
            )}

            {/* Miesto */}
            <Text style={styles.label}>Miesto</Text>
            <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="napr. Hala Jedlíkova"
                placeholderTextColor="#999"
            />
            {locationSuggestions.length > 0 && (
                <View style={styles.suggestionRow}>
                  {locationSuggestions.map((loc) => (
                      <SuggestionChip
                          key={loc}
                          label={loc}
                          onPick={() => setLocation(loc)}
                          onRemove={async () => {
                            const updated = locationSuggestions.filter((i) => i !== loc);
                            setLocationSuggestions(updated);
                            await AsyncStorage.setItem("history_location", JSON.stringify(updated));
                          }}
                      />
                  ))}
                </View>
            )}

            {/* Dátum a čas */}
            <Text style={styles.label}>Dátum a čas</Text>

            <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "android") {
                    // Android – postupne vyberieš dátum a čas
                    DateTimePickerAndroid.open({
                      value: date,
                      mode: "date",
                      onChange: (e, selected) => {
                        if (e.type === "set" && selected) {
                          const next = new Date(date);
                          next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                          setDate(next);
                          openAndroidTime(next);
                        }
                      },
                    });
                  } else {
                    setShowDateTimePicker((s) => !s);
                  }
                }}
                style={[styles.dateButton, submitting && { opacity: 0.6 }]}
                disabled={submitting}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString("sk-SK")}{" "}
                {date.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && showDateTimePicker && (
                <View style={[styles.pickerContainer, styles.iosPickerWrapper]}>
                  <DateTimePicker
                      value={date}
                      mode="datetime"
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) {
                          const next = new Date(selectedDate);
                          next.setSeconds(0, 0);
                          setDate(next);
                        }
                      }}
                      // @ts-ignore iOS prop
                      textColor="#000"
                      style={{ width: "100%" }}
                  />
                </View>
            )}
          </View>

          <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Ukladám..." : eventType === "training" ? "Vytvoriť tréning" : "Vytvoriť zápas"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
}

// Malý helper na „chip“ návrhy s delete
function SuggestionChip({
                          label,
                          onPick,
                          onRemove,
                        }: {
  label: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
      <TouchableOpacity
          onPress={onPick}
          onLongPress={() =>
              Alert.alert("Odstrániť?", `Chceš odstrániť „${label}“ z návrhov?`, [
                { text: "Zrušiť", style: "cancel" },
                { text: "Odstrániť", style: "destructive", onPress: onRemove },
              ])
          }
          style={styles.chip}
      >
        <Text style={styles.chipText}>{label}</Text>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f4f8", paddingTop: 0 },
  container: { padding: 20, flexGrow: 1, paddingTop: 0 },
  // ⭐ prepínač
  switchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignSelf: "center",
    backgroundColor: "#e9e9e9",
    borderRadius: 10,
    padding: 6,
  },
  switchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  switchBtnActive: {
    backgroundColor: "#D32F2F",
  },
  switchText: { fontWeight: "700", color: "#333" },
  switchTextActive: { color: "#fff" },

  iosPickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  label: { marginTop: 10, marginBottom: 6, fontWeight: "600", color: "#333" },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#000",
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: { backgroundColor: "#D32F2F" },
  chipText: { fontWeight: "600", color: "#111" },
  suggestionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  dateButton: {
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  dateButtonText: { color: "#fff", fontWeight: "600" },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 15, padding: 6 },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
});