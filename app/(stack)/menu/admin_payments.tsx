import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    StyleSheet,
    Platform,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import CustomSelectModal from "@/components/CustomSelectModal";

export default function CreatePaymentScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const fetchData = async () => {
        try {
            const [usersRes, catRes] = await Promise.all([
                fetchWithAuth(`${BASE_URL}/users-in-club/`),
                fetchWithAuth(`${BASE_URL}/categories-in-club/`),
            ]);
            const usersData = await usersRes.json();
            const catData = await catRes.json();
            setUsers(usersData);
            setCategories(catData);
        } catch (e) {
            console.error("❌ Chyba pri načítaní údajov:", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!amount) {
            Alert.alert("Chyba", "Zadaj sumu platby.");
            return;
        }

        const payload = {
            amount,
            due_date: dueDate.toISOString().split("T")[0],
            description,
        };

        if (selectedUserId) {
            payload.user_id = selectedUserId;
        } else if (selectedCategoryId) {
            payload.category_id = selectedCategoryId;
        }

        try {
            const res = await fetchWithAuth(`${BASE_URL}/create-member-payments/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                Alert.alert("❌ Chyba", err.error || "Nepodarilo sa vytvoriť platbu.");
                return;
            }

            Alert.alert("✅ Platby vytvorené!");
            setAmount("");
            setDescription("");
            setSelectedUserId(null);
            setSelectedCategoryId(null);
        } catch (e) {
            console.error("❌ Chyba pri vytváraní platby:", e);
            Alert.alert("❌ Chyba", "Skontroluj spojenie.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Vytvoriť platbu pre členov</Text>

            <Text style={styles.label}>💶 Suma (€)</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="napr. 25.00"
                keyboardType="decimal-pad"
            />

            <Text style={styles.label}>📝 Popis platby</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="napr. Clenske za september"
            />

            <Text style={styles.label}>📅 Dátum splatnosti</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                    {dueDate.toLocaleDateString("sk-SK")}
                </Text>
            </TouchableOpacity>
            {showPicker && (
                <View style={Platform.OS === "ios" ? styles.iosPickerWrapper : undefined}>
                    <DateTimePicker
                        value={dueDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, selectedDate) => {
                            if (selectedDate) setDueDate(selectedDate);
                            setShowPicker(false);
                        }}
                        textColor="#000"
                        style={{ width: "100%" }}
                    />
                </View>
            )}

            <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}>
                <Text style={[styles.label, { color: "#D32F2F" }]}>⚙️ Rozšírené možnosti</Text>
            </TouchableOpacity>

            {showAdvanced && (
                <>
                    <Text style={styles.label}>👤 Konkrétny hráč (voliteľné)</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setUserModalVisible(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {selectedUserId ? users.find(u => u.id === selectedUserId)?.name || "Vybraný hráč" : "Vybrať hráča"}
                        </Text>
                    </TouchableOpacity>
                    <CustomSelectModal
                        visible={userModalVisible}
                        title="Vyber hráča"
                        options={users.map(u => ({ label: u.name || u.username, value: u.id }))}
                        onSelect={(val) => {
                            setSelectedUserId(val);
                            setSelectedCategoryId(null);
                            setUserModalVisible(false);
                        }}
                        onClose={() => setUserModalVisible(false)}
                    />

                    <Text style={styles.label}>📂 Alebo kategória (voliteľné)</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setCategoryModalVisible(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || "Vybraná kategória" : "Vybrať kategóriu"}
                        </Text>
                    </TouchableOpacity>
                    <CustomSelectModal
                        visible={categoryModalVisible}
                        title="Vyber kategóriu"
                        options={categories.map(c => ({ label: c.name, value: c.id }))}
                        onSelect={(val) => {
                            setSelectedCategoryId(val);
                            setSelectedUserId(null);
                            setCategoryModalVisible(false);
                        }}
                        onClose={() => setCategoryModalVisible(false)}
                    />
                </>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>💰 Vytvoriť platbu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/menu/payments_settings' })}>
                <Text style={styles.buttonText}>Nastavenia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/menu/payments_admin_control' })}>
                <Text style={styles.buttonText}>Kontrola</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/menu/UploadPayments' })}>
                <Text style={styles.buttonText}>Kontrola</Text>
            </TouchableOpacity>

            <Text style={styles.note}>
                🛈 Ak nezvolíš hráča ani kategóriu, platba sa vytvorí pre všetkých členov klubu.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
    label: { fontWeight: "600", marginTop: 10, marginBottom: 6 },
    input: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    dateButton: {
        backgroundColor: "#D32F2F",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    dateButtonText: { color: "#fff", fontWeight: "600" },
    button: {
        backgroundColor: "#4CAF50",
        marginTop: 20,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    note: {
        marginTop: 20,
        fontSize: 13,
        color: "#555",
        fontStyle: "italic",
        textAlign: "center",
    },
    iosPickerWrapper: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        marginTop: 10,
        marginBottom: 10,
    }
});