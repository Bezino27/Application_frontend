import React, { useContext, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
    const {
        isLoggedIn,
        userClub,
        userDetails,
    } = useContext(AuthContext);

    const router = useRouter();
    useEffect(() => {
        if (!isLoggedIn) {
            router.replace("/login");
        }
    }, [isLoggedIn]);


    if (!isLoggedIn) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Overujem prihlásenie...</Text>
            </View>
        );
    }



    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.titleRow}>
                    <View style={styles.headerRow}>
                        <Text style={styles.heading}>
                            👋 Vitaj, {userDetails?.username || "hráč"}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <ProfileRow label="Používateľské meno" value={userDetails?.username} />
                    <ProfileRow label="Email" value={userDetails?.email} />
                    <ProfileRow label="Alternatívny email" value={userDetails?.email_2} />
                    <ProfileRow label="Dátum narodenia" value={userDetails?.birth_date} />
                    <ProfileRow label="Výška" value={userDetails?.height ? `${userDetails.height} cm` : undefined} />
                    <ProfileRow label="Váha" value={userDetails?.weight ? `${userDetails.weight} kg` : undefined} />
                    <ProfileRow label="Strana hokejky" value={userDetails?.side} />
                    <ProfileRow label="Pozícia" value={userDetails?.position?.name ?? ''} />
                    <ProfileRow label="Číslo na drese" value={userDetails?.number} />
                    <ProfileRow label="Klub" value={userClub?.name} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const ProfileRow = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f4f4f8",
    },
    container: {
        padding: 20,
        paddingTop: 0,
    },
    titleRow: {
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e1e1e",
        flex: 1,
        paddingTop: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomColor: "#eee",
        borderBottomWidth: 1,
        paddingVertical: 10,
    },
    label: {
        color: "#555",
        fontWeight: "600",
        fontSize: 15,
        flex: 1.2,
    },
    value: {
        color: "#222",
        fontSize: 15,
        flex: 1.5,
        textAlign: "right",
    },
    subheading: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 10,
        color: "#333",
    },
    rolesContainer: {
        flexDirection: "column",
        gap: 10,
        marginBottom: 20,
    },
    chipButton: {
        backgroundColor: "#b3b3b3",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipButtonText: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
    },
    activeChip: {
        backgroundColor: "#000000",
    },
    activeChipText: {
        color: "#fff",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
    },
});