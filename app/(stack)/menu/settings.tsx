import React, { useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";

// Aktivuj animácie pre Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, userDetails, setUserDetails } = useContext(AuthContext);
    const { fetchWithAuth } = useFetchWithAuth();

    const [preferred, setPreferred] = useState(userDetails?.preferred_role || "");
    const [showRoleSection, setShowRoleSection] = useState(false);
    const [showDeleteSection, setShowDeleteSection] = useState(false);

    const handleLogout = () => {
        Alert.alert("Odhlásenie", "Naozaj sa chceš odhlásiť?", [
            { text: "Zrušiť", style: "cancel" },
            { text: "Odhlásiť sa", style: "destructive", onPress: logout },
        ]);
    };

    const handleSavePreferredRole = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/set-preferrd-role/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferred_role: preferred }),
            });

            if (!res.ok) throw new Error();

            if (userDetails) {
                setUserDetails({ ...userDetails, preferred_role: preferred });
            }

            Alert.alert("✅ Uložené", "Preferovaná rola bola nastavená.");
        } catch {
            Alert.alert("❌ Chyba", "Nepodarilo sa uložiť rolu.");
        }
    };

    const toggleRoleSection = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowRoleSection(!showRoleSection);
    };

    const toggleDeleteSection = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDeleteSection(!showDeleteSection);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "⚠️ Naozaj chcete odstrániť účet?",
            "Tento krok je nevratný. Všetky tvoje údaje, štatistiky a prístupy budú natrvalo zmazané.",
            [
                { text: "Zrušiť", style: "cancel" },
                {
                    text: "Vymazať účet",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetchWithAuth(`${BASE_URL}/delete-account/`, { 
                                method: "DELETE" }
                            );

                            if (!res.ok) throw new Error("Chyba pri mazaní účtu");

                            Alert.alert("✅ Účet bol vymazaný", "Všetky údaje boli natrvalo odstránené.");
                            logout();
                        } catch {
                            Alert.alert("❌ Chyba", "Nepodarilo sa vymazať účet. Skús to znova.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push("/profile-edit")}
            >
                <Text style={styles.settingText}>Upraviť profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push("/change-password")}
            >
                <Text style={styles.settingText}>Zmeniť heslo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={toggleRoleSection}>
                <Text style={styles.settingText}>Preferovaná rola</Text>
            </TouchableOpacity>

            {showRoleSection && (
                <View style={styles.roleSection}>
                    {["player", "coach", "admin"].map((role) => (
                        <TouchableOpacity
                            key={role}
                            onPress={() => setPreferred(role)}
                            style={[
                                styles.roleButton,
                                preferred === role && styles.roleButtonSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.roleButtonText,
                                    preferred === role && styles.roleButtonTextSelected,
                                ]}
                            >
                                {role === "player"
                                    ? "Hráč"
                                    : role === "coach"
                                    ? "Tréner"
                                    : "Admin"}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.savePrefButton}
                        onPress={handleSavePreferredRole}
                    >
                        <Text style={styles.savePrefText}>Uložiť preferovanú rolu</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ⚠️ Vymazať účet sekcia */}
            <TouchableOpacity style={styles.settingItem} onPress={toggleDeleteSection}>
                <Text style={[styles.settingText, { color: "#b00020" }]}>Vymazať účet</Text>
            </TouchableOpacity>

            {showDeleteSection && (
                <View style={styles.deleteSection}>
                    <Text style={styles.warningText}>
                        Týmto si natrvalo odstránite svoj účet a všetky údaje ako aj štatistiky
                        budú nenávratne vymazané.
                    </Text>

                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.deleteAccountText}>Odstrániť účet</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                style={[styles.settingItem, styles.logout]}
                onPress={handleLogout}
            >
                <Text style={[styles.settingText, { color: "#b00020" }]}>Odhlásiť sa</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f8",
        padding: 20,
    },
    settingItem: {
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 12,
        marginBottom: 15,
        borderColor: "#e0e0e0",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 5,
    },
    settingText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
    },
    logout: {
        backgroundColor: "#fff3f3",
        borderColor: "#ffcccc",
    },
    roleSection: {
        marginBottom: 20,
        marginTop: -10,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 10,
        borderColor: "#ddd",
        borderWidth: 1,
    },
    roleButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: "#e0e0e0",
        marginBottom: 10,
    },
    roleButtonSelected: {
        backgroundColor: "#D32F2F",
    },
    roleButtonText: {
        color: "#000",
        fontWeight: "600",
    },
    roleButtonTextSelected: {
        color: "#fff",
    },
    savePrefButton: {
        backgroundColor: "#4CAF50",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    savePrefText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    deleteSection: {
        backgroundColor: "#fff",
        borderColor: "#ffcccc",
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        marginBottom: 15,
    },
    warningText: {
        color: "#b00020",
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 10,
    },
    deleteAccountButton: {
        backgroundColor: "#b00020",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    deleteAccountText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
