// app/(tabs)/matches.tsx

import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { AuthContext } from "@/context/AuthContext";
import { BASE_URL } from "@/hooks/api";
import { router } from "expo-router";

type Match = {
  id: number;
  club_name: string;
  date: string;
  location: string;
  opponent: string;
  description: string;
  category: number;
  category_name: string;
  user_status: "confirmed" | "declined" | "unknown";
  rating?: number;
  plus_minus?: number;
  is_home: boolean; 

};

export default function MatchesScreen() {
  const { fetchWithAuth } = useFetchWithAuth();
  const { userRoles } = useContext(AuthContext);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ODOHRANÉ" | "NEODOHRANÉ">("NEODOHRANÉ");
  const [voteLockDays, setVoteLockDays] = useState(0);

  // modal states
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

const fetchMatches = async (selectedFilter: "ODOHRANÉ" | "NEODOHRANÉ" = "NEODOHRANÉ") => {
  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/matches_filtered/?filter=${selectedFilter}`
    );
    if (response.ok) {
      const data = await response.json();
      let fetchedMatches = data.matches;

      // 🔽 Ak ide o odohrané zápasy → zoradíme zostupne (novšie hore)
      if (selectedFilter === "ODOHRANÉ") {
        fetchedMatches = fetchedMatches.sort(
          (a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } else {
        // Neodohrané – zoradíme vzostupne (najbližšie hore)
        fetchedMatches = fetchedMatches.sort(
          (a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }

      setMatches(fetchedMatches);
      setVoteLockDays(data.vote_lock_days);
    } else {
      const error = await response.text();
      console.error("Chyba pri načítaní zápasov:", error);
    }
  } catch (e) {
    console.error("❌ Chyba pri fetchnutí zápasov:", e);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchMatches("NEODOHRANÉ"); // načítaj defaultne len budúce zápasy
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(filter);
  };

  const onFilterChange = async (newFilter: "ODOHRANÉ" | "NEODOHRANÉ") => {
    setFilter(newFilter);
    setLoading(true);
    await fetchMatches(newFilter);
  };

  const updateStatus = async (
    matchId: number,
    status: "confirmed" | "declined",
    reason?: string
  ) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const diffDays = (new Date(match.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < voteLockDays) {
      Alert.alert(
        `Zmenu stavu je možné vykonať najneskôr ${voteLockDays} dni pred zápasom.`
      );
      return;
    }

    try {
      const res = await fetchWithAuth(`${BASE_URL}/match-participations/`, {
        method: "POST",
        body: JSON.stringify({
          match: matchId,
          confirmed: status === "confirmed",
          reason: reason ?? null,
        }),
      });

      if (res.ok) fetchMatches(filter);
      else Alert.alert("Nepodarilo sa uložiť stav.");
    } catch (e) {
      Alert.alert("Chyba pri ukladaní účasti.");
    }
  };

  const grouped = matches.reduce((acc, match) => {
    if (!acc[match.category_name]) acc[match.category_name] = [];
    acc[match.category_name].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      style={{ padding: 20 }}
    >
      <View style={styles.filterRow}>
        {["NEODOHRANÉ", "ODOHRANÉ"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => onFilterChange(f as any)}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          >
            <Text style={filter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={{ marginBottom: 30 }}>
          <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 15 }}>{category}</Text>

          {items.map((m) => {
            const matchDate = new Date(m.date);
            const editable =
              matchDate.getTime() - Date.now() > voteLockDays * 24 * 60 * 60 * 1000;

            return (
              <TouchableOpacity key={m.id} onPress={() => router.push(`/match/${m.id}`)}>
              <ImageBackground
                source={
                  m.is_home
                    ? require("@/assets/images/zapas_doma.png")  // 🏠 domáci zápas
                    : require("@/assets/images/zapas_vonku.png") // 🚌 vonkajší zápas
                }
                imageStyle={{ borderRadius: 10 }}
                style={styles.card}
              >
                  <Text style={styles.title}>{m.opponent}</Text>
                  <Text style={styles.date}>
                    {matchDate.toLocaleTimeString("sk-SK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    •{" "}
                    {matchDate.toLocaleDateString("sk-SK", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.location}>📍 {m.location}</Text>
                  {m.rating != null && (
                    <Text style={styles.stats}>⭐ Hodnotenie: {m.rating}</Text>
                  )}
                  {m.plus_minus != null && (
                    <Text style={styles.stats}>
                      plus/mínus {m.plus_minus >= 0 ? "+" : ""}
                      {m.plus_minus}
                    </Text>
                  )}

                  {editable ? (
                    <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
                      {["confirmed", "declined"].map((status) => {
                        const label = status === "confirmed" ? "Môžem" : "Nemôžem";
                        const isSelected = m.user_status === status;
                        const backgroundColor = isSelected
                          ? status === "confirmed"
                            ? "#4CAF50"
                            : "#D32F2F"
                          : "#e0e0e0";

                        return (
                          <TouchableOpacity
                            key={status}
                            onPress={() => {
                              if (status === "declined") {
                                setSelectedMatchId(m.id);
                                setShowReasonModal(true);
                              } else {
                                updateStatus(m.id, status as any);
                              }
                            }}
                            style={{
                              backgroundColor,
                              paddingVertical: 6,
                              paddingHorizontal: 14,
                              borderRadius: 20,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? "#fff" : "#000",
                                fontWeight: "600",
                              }}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.note}>
                      Zmena účasti už nie je možná 
                    </Text>
                  )}
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Modal pre dôvod neprítomnosti */}
      {showReasonModal && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => setShowReasonModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Vyber dôvod neprítomnosti</Text>

                {["Škola", "Práca", "Choroba", "Zranenie", "Iné"].map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonButton,
                      {
                        backgroundColor:
                          selectedReason === reason ? "#D32F2F" : "#e0e0e0",
                      },
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text
                      style={{
                        color: selectedReason === reason ? "#fff" : "#000",
                      }}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                {selectedReason === "Iné" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Zadaj dôvod..."
                    placeholderTextColor="#666"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                  />
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 15,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setShowReasonModal(false);
                      setSelectedReason(null);
                      setCustomReason("");
                      Keyboard.dismiss();
                    }}
                    style={[styles.reasonButton, { backgroundColor: "#ccc" }]}
                  >
                    <Text style={{ color: "#000", margin: 7 }}>Zrušiť</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (!selectedReason) {
                        Alert.alert("Chyba", "Vyber prosím dôvod.");
                        return;
                      }

                      if (selectedReason === "Iné" && !customReason.trim()) {
                        Alert.alert(
                          "Chyba",
                          "Prosím, napíš dôvod, keď vyberieš možnosť 'Iné'."
                        );
                        return;
                      }

                      const finalReason =
                        selectedReason === "Iné"
                          ? customReason.trim()
                          : selectedReason;

                      updateStatus(selectedMatchId!, "declined", finalReason);
                      setShowReasonModal(false);
                      setSelectedReason(null);
                      setCustomReason("");
                      Keyboard.dismiss();
                    }}
                    style={[styles.reasonButton, { backgroundColor: "#D32F2F" }]}
                  >
                    <Text style={{ color: "#fff", margin: 7 }}>Potvrdiť</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filterButtonActive: {
    backgroundColor: "#D32F2F",
  },
  filterText: {
    color: "#444",
    fontWeight: "500",
    fontSize: 12,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8C1919",
    marginBottom: 6,
  },
  date: {
    color: "#555",
    fontWeight: "bold",
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
  },
  note: {
    color: "gray",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  stats: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  reasonButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
});
