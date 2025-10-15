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
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { AuthContext } from "@/context/AuthContext";
import { BASE_URL } from "@/hooks/api";
import { router } from "expo-router"; // ← pridaj hore do importov

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
};

export default function MatchesScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userRoles } = useContext(AuthContext);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<"VŠETKY" | "ODOHRANÉ" | "NEODOHRANÉ">("VŠETKY");

    const fetchMatches = async () => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/matches-coach/`);
            if (response.ok) {
                const data = await response.json();
                setMatches(data);
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
        fetchMatches();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMatches();
    };

    const updateStatus = async (matchId: number, status: "confirmed" | "declined") => {
        const match = matches.find((m) => m.id === matchId);
        if (!match) return;

        const diffDays = (new Date(match.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays < 2) {
            Alert.alert("Zmenu stavu je možné vykonať najneskôr 2 dni pred zápasom.");
            return;
        }

        try {
            const res = await fetchWithAuth(`${BASE_URL}/match-participations/`, {
                method: "POST",
                body: JSON.stringify({ match: matchId, confirmed: status === "confirmed" }),
            });

            if (res.ok) fetchMatches();
            else Alert.alert("Nepodarilo sa uložiť stav.");
        } catch (e) {
            Alert.alert("Chyba pri ukladaní účasti.");
        }
    };

    const filteredMatches = matches.filter((m) => {
        const isPast = new Date(m.date) < new Date();
        if (filter === "VŠETKY") return true;
        if (filter === "ODOHRANÉ") return isPast;
        if (filter === "NEODOHRANÉ") return !isPast;
    });

    const grouped = filteredMatches.reduce((acc, match) => {
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
                {["VŠETKY", "ODOHRANÉ", "NEODOHRANÉ"].map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setFilter(f as any)}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                    >
                        <Text style={filter === f ? styles.filterTextActive : styles.filterText}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {Object.entries(grouped).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 30 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 15 }}>{category}</Text>

                    {items.map((m) => {
                        const matchDate = new Date(m.date);
                        const editable = (matchDate.getTime() - Date.now()) > 2 * 24 * 60 * 60 * 1000;

                        return (
                            <TouchableOpacity key={m.id} onPress={() => router.push(`/match/${m.id}`)}>
                                <ImageBackground
                                    source={require("@/assets/images/zapas_pozadie.png")}
                                    imageStyle={{ borderRadius: 10 }}
                                    style={styles.card}
                                >
                                    <Text style={styles.title}>
                                        {m.opponent}
                                    </Text>
                                    <Text style={styles.date}>
                                        {matchDate.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })} •{" "}
                                        {matchDate.toLocaleDateString("sk-SK", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </Text>
                                    <Text style={styles.location}>📍 {m.location}</Text>


                                </ImageBackground>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
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
    status: {
        fontStyle: "italic",
        color: "#666",
    },
    note: {
        color: "gray",
        fontSize: 12,
        marginTop: 10,
        fontStyle: "italic",
    },
});