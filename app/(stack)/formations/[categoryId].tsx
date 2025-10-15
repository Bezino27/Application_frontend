import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { AuthContext } from "@/context/AuthContext";

type Player = {
  id: number;
  name: string;
  position?: string;
};

type FormationPlayer = {
  id: number;
  player: number;
  player_name: string;
  position: string;
};

type FormationLine = {
  id: number;
  number: number;
  players: FormationPlayer[];
};

type Formation = {
  id: number;
  name: string;
  lines: FormationLine[];
};

export default function FormationEditorScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { fetchWithAuth } = useFetchWithAuth();
  const { currentRole } = useContext(AuthContext);

  const [formations, setFormations] = useState<Formation[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [newFormationName, setNewFormationName] = useState("");
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const isCoach = currentRole?.role === "coach";

  // 🧠 načítanie formácií
  const loadFormations = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/formations/${categoryId}/`);
      const data = await res.json();
      setFormations(data);
    } catch (err) {
      console.error("❌ Chyba pri načítaní formácií:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 načítanie hráčov
  const loadPlayers = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/players-in-category/${categoryId}/`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("❌ Chyba pri načítaní hráčov:", err);
    }
  };

  useEffect(() => {
    loadFormations();
    loadPlayers();
  }, [categoryId]);

  // ✅ vytvorenie formácie
  const createFormation = async () => {
    if (!newFormationName.trim()) return Alert.alert("Zadaj názov formácie");
    try {
      const res = await fetchWithAuth(`${BASE_URL}/formations/${categoryId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFormationName }),
      });
      if (!res.ok) throw new Error("Chyba pri vytváraní formácie");
      setNewFormationName("");
      loadFormations();
      Alert.alert("✅ Formácia vytvorená");
    } catch {
      Alert.alert("Chyba", "Nepodarilo sa vytvoriť formáciu");
    }
  };

  // ✅ zmazanie formácie
  const deleteFormation = async (id: number) => {
    Alert.alert("Zmazať formáciu?", "Naozaj chceš zmazať túto formáciu?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Zmazať",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`${BASE_URL}/formation/${id}/`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            loadFormations();
          } catch {
            Alert.alert("Chyba", "Nepodarilo sa zmazať formáciu");
          }
        },
      },
    ]);
  };

  // ✅ pridanie päťky
  const addLine = async (formationId: number) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/formation/${formationId}/add-line/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      loadFormations();
    } catch {
      Alert.alert("Chyba", "Nepodarilo sa pridať päťku");
    }
  };

  // ✅ odstránenie päťky
  const deleteLine = async (formationId: number, lineId: number) => {
    Alert.alert("Zmazať päťku?", "Naozaj chceš zmazať túto päťku?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Zmazať",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`${BASE_URL}/formation-line/${lineId}/player/`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delete_line: true }),
            });
            if (!res.ok) throw new Error();
            loadFormations();
          } catch {
            Alert.alert("Chyba", "Nepodarilo sa zmazať päťku");
          }
        },
      },
    ]);
  };

  // ✅ pridanie hráča
  const addPlayer = async () => {
    if (!selectedLineId || !selectedPosition || !selectedPlayerId) return;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/formation-line/${selectedLineId}/player/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: selectedPlayerId,
          position: selectedPosition,
        }),
      });
      if (!res.ok) throw new Error();
      setShowPlayerModal(false);
      loadFormations();
    } catch {
      Alert.alert("Chyba", "Nepodarilo sa pridať hráča");
    }
  };

  // ✅ zmazanie hráča
  const removePlayer = async (lineId: number, playerId: number) => {
    try {
      await fetchWithAuth(`${BASE_URL}/formation-line/${lineId}/player/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: playerId }),
      });
      loadFormations();
    } catch {
      Alert.alert("Chyba", "Nepodarilo sa odstrániť hráča");
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Formácie kategórie</Text>

      {isCoach && (
        <View style={styles.addFormationBox}>
          <TextInput
            placeholder="Názov formácie"
            value={newFormationName}
            onChangeText={setNewFormationName}
            style={styles.input}
          />
          <TouchableOpacity style={styles.createBtn} onPress={createFormation}>
            <Text style={styles.createText}>➕</Text>
          </TouchableOpacity>
        </View>
      )}

      {formations.map((f) => (
        <View key={f.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>{f.name}</Text>
            <TouchableOpacity onPress={() => deleteFormation(f.id)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {isCoach && (
            <TouchableOpacity style={styles.subButton} onPress={() => addLine(f.id)}>
              <Text style={styles.subButtonText}>➕ Päťka</Text>
            </TouchableOpacity>
          )}

          {f.lines.map((line) => (
            <View key={line.id} style={styles.lineBox}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineTitle}>{line.number}. päťka</Text>
                <TouchableOpacity onPress={() => deleteLine(f.id, line.id)}>
                  <Text style={styles.deleteLineText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {["LW", "C", "RW", "LD", "RD", "N"].map((pos) => {
                const player = line.players.find((p) => p.position === pos);
                return (
                  <TouchableOpacity
                    key={pos}
                    style={styles.positionRow}
                    onPress={() => {
                      if (player) {
                        Alert.alert(
                          "Odstrániť hráča?",
                          `${player.player_name} (${pos})`,
                          [
                            { text: "Zrušiť", style: "cancel" },
                            {
                              text: "Odstrániť",
                              style: "destructive",
                              onPress: () => removePlayer(line.id, player.id),
                            },
                          ]
                        );
                      } else {
                        setSelectedLineId(line.id);
                        setSelectedPosition(pos);
                        setShowPlayerModal(true);
                      }
                    }}
                  >
                    <Text style={styles.positionLabel}>{pos}</Text>
                    <Text style={{ color: player ? "#111" : "#aaa" }}>
                      {player ? player.player_name : "— pridať hráča —"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      ))}

      {/* 🧩 MODAL výber hráča */}
      <Modal visible={showPlayerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Vyber hráča</Text>
            <FlatList
              data={players}
              keyExtractor={(p) => p.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.playerItem,
                    selectedPlayerId === item.id && { backgroundColor: "#D32F2F22" },
                  ]}
                  onPress={() => setSelectedPlayerId(item.id)}
                >
                  <Text style={styles.playerText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={addPlayer}>
              <Text style={styles.confirmText}>✅ Pridať</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <Text style={styles.cancelText}>Zrušiť</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#e0e0e0", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#D32F2F" },
  deleteText: { color: "#D32F2F", fontSize: 18 },
  subButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: "center",
  },
  subButtonText: { color: "#fff", fontWeight: "bold" },
  lineBox: {
    marginTop: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
  },
  lineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  deleteLineText: { fontSize: 16, color: "#555" },
  lineTitle: { fontWeight: "bold", color: "#333" },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  positionLabel: { fontWeight: "bold", color: "#444" },
  addFormationBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  createBtn: {
    marginLeft: 10,
    backgroundColor: "#D32F2F",
    padding: 10,
    borderRadius: 8,
  },
  createText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  playerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  playerText: { fontSize: 16, color: "#111" },
  confirmButton: {
    marginTop: 10,
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "bold" },
  cancelText: { color: "#555", textAlign: "center", marginTop: 8 },
});
