import React, { useContext, useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { BASE_URL } from "@/hooks/api";

// Pomocná funkcia pre prevod dátumu z 5.5.2020 na 2020-05-05
function formatDateToBackend(date: string): string {
  const parts = date.split(".");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((p) => p.trim().padStart(2, "0"));
    return `${year}-${month}-${day}`;
  }
  return date;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userDetails, accessToken, setUserDetails } = useContext(AuthContext);

  const [username, setuserName] = useState(userDetails?.username || "");
  const [email, setEmail] = useState(userDetails?.email || "");
  const [email2, setEmail2] = useState(userDetails?.email_2 || "");
  const [birthDate, setBirthDate] = useState(() => {
    const date = userDetails?.birth_date;
    if (date) {
      const [y, m, d] = date.split("-");
      return `${Number(d)}.${Number(m)}.${y}`;
    }
    return "";
  });
  const [height, setHeight] = useState(userDetails?.height || "");
  const [weight, setWeight] = useState(userDetails?.weight || "");
  const [side, setSide] = useState(userDetails?.side || "");
  const [number, setNumber] = useState(userDetails?.number || "");

  const [position, setPosition] = useState<number | null>(null);
  const [positionName, setPositionName] = useState<string>("");
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (userDetails?.position && typeof userDetails.position === "string") {
      setPositionName(userDetails.position);
    }
  }, [userDetails]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch(`${BASE_URL}/positions/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        setPositions(data);
      } catch (e) {
        console.error("Nepodarilo sa načítať pozície", e);
      }
    };

    if (accessToken) fetchPositions();
  }, [accessToken]);

  const handleSave = async () => {
    try {
      let selectedPositionId = position;

      // Ak nebolo vybrané ID ale máme meno, pokúsime sa ho nájsť v zozname
      if (!selectedPositionId && positionName) {
        const found = positions.find((p) => p.name === positionName);
        if (found) selectedPositionId = found.id;
      }

      const payload = {
        username,
        email,
        email_2: email2,
        birth_date: formatDateToBackend(birthDate),
        height,
        weight,
        side,
        number,
        position: selectedPositionId,
      };

      const res = await fetch(`${BASE_URL}/me/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        const errorMsg = Object.entries(errData)
            .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(", ") : msg}`)
            .join("\n");
        throw new Error(errorMsg || "Nepodarilo sa uložiť údaje");
      }

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
    } catch (e: any) {
      Alert.alert("Chyba", e.message || "Skontroluj údaje alebo spojenie");
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
            <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                style={styles.input}
                placeholder="napr. 5.5.2008"
            />
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

          <View style={styles.field}>
            <Text style={styles.label}>Pozícia</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
              <Text style={{ color: positionName ? "#000" : "#888" }}>
                {positionName || "Vyber pozíciu"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonWrapper}>
            <Button title="💾 Uložiť" onPress={handleSave} color="#007AFF" />
          </View>
        </ScrollView>

        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {positions.map((pos) => (
                  <TouchableOpacity
                      key={pos.id}
                      style={styles.modalOption}
                      onPress={() => {
                        setPosition(pos.id);
                        setPositionName(pos.name);
                        setModalVisible(false);
                      }}
                  >
                    <Text style={styles.modalOptionText}>{pos.name}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "80%",
    maxHeight: "60%",
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
});