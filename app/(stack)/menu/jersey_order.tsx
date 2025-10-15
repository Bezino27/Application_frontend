import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

export default function JerseyOrderScreen() {
  const router = useRouter();
  const { userClub } = useContext(AuthContext);
  const { fetchWithAuth } = useFetchWithAuth();

  const [surname, setSurname] = useState("");
  const [jerseySize, setJerseySize] = useState<string | null>(null);
  const [shortsSize, setShortsSize] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<
    { name: string; birth_year: string }[]
  >([]);

  useEffect(() => {
    Alert.alert(
      "Informácie o objednávke dresov",
      "Pri objednávke dresu je potrebné vyplniť všetky požadované údaje:\n\n" +
        "• Zadaj priezvisko presne tak, ako ho chceš mať uvedené na drese.\n" +
        "• Zvoľ si veľkosť dresu aj kraťasov (XXS – XXL).\n" +
        "• Vyber číslo na dres. Pri výbere čísla sa zobrazia všetci členovia klubu, ktorí už dané číslo používajú.\n\n" +
        "Dôležité pravidlo: Číslo na drese nemôžeš mať rovnaké ako hráč, ktorého rok narodenia je v rozmedzí +- 3 roky od tvojho ročníka.\n" +
        "Príklad: ak si ročník 2009, nesmieš si zvoliť číslo, ktoré už používa hráč narodený v rokoch 2007, 2008, 2009, 2010, 2011 alebo 2012.\n\n" +
        "Objednávka bude záväzná až po potvrdení a kontrole klubom."
    );
  }, []);

  const checkNumber = async (num: string) => {
    if (!num.trim()) {
      setCheckResult(null);
      setConflicts([]);
      return;
    }
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/clubs/${userClub?.id}/check-number/${num}/`
      );
      if (res.ok) {
        const data = await res.json();

        if (data.taken && data.players?.length > 0) {
          setCheckResult(`Číslo ${num} už používajú:`);
          setConflicts(data.players);
        } else {
          setCheckResult(`Číslo ${num} je voľné`);
          setConflicts([]);
        }
      } else {
        setCheckResult("Nepodarilo sa overiť číslo.");
        setConflicts([]);
      }
    } catch (err) {
      console.error(err);
      setCheckResult("Chyba spojenia so serverom.");
      setConflicts([]);
    }
  };

  const submit = async () => {
    if (!surname.trim() || !number.trim() || !jerseySize || !shortsSize) {
      Alert.alert("Chyba", "Vyplň všetky údaje.");
      return;
    }

    const payload = {
      club: userClub?.id,
      surname,
      jersey_size: jerseySize,
      shorts_size: shortsSize,
      number,
    };

    const res = await fetchWithAuth(`${BASE_URL}/orders/jersey/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      Alert.alert(
        "✅ Objednávka odoslaná",
        "Tvoja objednávka na dres bola uložená."
      );
      router.back();
    } else {
      const txt = await res.text();
      Alert.alert("❌ Chyba", txt);
    }
  };

  const canSubmit = surname.trim() && number.trim() && jerseySize && shortsSize;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Objednávka dresu</Text>

          <Text style={styles.label}>Priezvisko na drese</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="napr. Novák"
          />

          <Text style={styles.label}>Veľkosť dresu</Text>
          <View style={styles.sizeRow}>
            {sizes.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sizeBox,
                  jerseySize === s && styles.sizeBoxActive,
                ]}
                onPress={() => setJerseySize(s)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    jerseySize === s && styles.sizeTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Veľkosť kraťasov</Text>
          <View style={styles.sizeRow}>
            {sizes.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sizeBox,
                  shortsSize === s && styles.sizeBoxActive,
                ]}
                onPress={() => setShortsSize(s)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    shortsSize === s && styles.sizeTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Číslo na drese</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={number}
            onChangeText={(t) => {
              setNumber(t);
              checkNumber(t);
            }}
            placeholder="napr. 15"
          />

          {checkResult && <Text style={styles.checkText}>{checkResult}</Text>}
          {conflicts.length > 0 && (
            <View style={styles.conflicts}>
              {conflicts.map((p, i) => (
                <Text key={i} style={styles.conflictText}>
                  - {p.name} ({p.birth_year})
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, !canSubmit && { opacity: 0.6 }]}
            disabled={!canSubmit}
            onPress={submit}
          >
            <Text style={styles.btnText}>Odoslať objednávku</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#111" },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 6, color: "#444" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    height: 42,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  sizeBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 6,
    marginBottom: 6,
  },
  sizeBoxActive: {
    backgroundColor: "#D32F2F",
  },
  sizeText: {
    fontWeight: "600",
    color: "#333",
  },
  sizeTextActive: {
    color: "#fff",
  },
  checkText: { marginTop: 6, fontSize: 14, color: "#D32F2F" },
  conflicts: { marginTop: 6, paddingLeft: 4 },
  conflictText: { fontSize: 13, color: "#444" },
  btn: {
    marginTop: 24,
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
