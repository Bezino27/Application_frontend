import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Picker } from "@react-native-picker/picker"; // nezabudni importovať

export default function PaymentSettingsScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userClub } = useContext(AuthContext);
    const [iban, setIban] = useState("");
    const [prefix, setPrefix] = useState("");
    const [dueDay, setDueDay] = useState("10");
    const [cycle, setCycle] = useState("monthly");

    const loadSettings = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/club-payments-settings/${userClub?.id}/`);
            const data = await res.json();
            setIban(data.iban);
            setPrefix(data.variable_symbol_prefix);
            setDueDay(String(data.due_day));
            setCycle(data.payment_cycle);
        } catch (e) {
            console.error("❌ Nepodarilo sa načítať nastavenia:", e);
        }
    };

    const saveSettings = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/club-payments-settings/${userClub?.id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    club: userClub?.id,
                    iban,
                    variable_symbol_prefix: prefix,
                    due_day: parseInt(dueDay),
                    payment_cycle: cycle,
                }),
            });
            if (!res.ok) throw new Error();
            Alert.alert("✅ Nastavenia uložené");
        } catch {
            Alert.alert("❌ Chyba pri ukladaní");
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>⚙️ Nastavenia platieb klubu</Text>

            <Text style={styles.label}>IBAN</Text>
            <TextInput style={styles.input} value={iban} onChangeText={setIban} />

            <Text style={styles.label}>Prefix pre VS</Text>
            <TextInput style={styles.input} value={prefix} onChangeText={setPrefix} />

            <Text style={styles.label}>Deň splatnosti</Text>
            <TextInput
                style={styles.input}
                value={dueDay}
                onChangeText={setDueDay}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Cyklus</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={cycle}
                    onValueChange={(value) => setCycle(value)}
                >
                    <Picker.Item label="Mesačný" value="monthly" />
                    <Picker.Item label="Štvrťročný" value="quarterly" />
                    <Picker.Item label="Polročný" value="half_year" />
                    <Picker.Item label="Celosezónny" value="seasonal" />
                </Picker>
            </View>
            <TouchableOpacity style={styles.button} onPress={saveSettings}>
                <Text style={styles.buttonText}>💾 Uložiť nastavenia</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
    label: { fontWeight: "600", marginTop: 12 },
    input: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    button: {
        backgroundColor: "#4CAF50",
        marginTop: 30,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#f2f2f2",
        marginBottom: 10,
    },
});