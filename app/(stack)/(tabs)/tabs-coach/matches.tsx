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
    is_home: boolean; 
};

export default function MatchesScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userRoles } = useContext(AuthContext);

    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<"NEODOHRANÉ" | "ODOHRANÉ">("NEODOHRANÉ");

    const getFilterParam = (f: "NEODOHRANÉ" | "ODOHRANÉ") =>
        f === "ODOHRANÉ" ? "past" : "upcoming";

    const fetchMatches = async (filterParam: "past" | "upcoming", isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const response = await fetchWithAuth(`${BASE_URL}/matches-coach/?filter=${filterParam}`);
            if (response.ok) {
                const data = await response.json();
                setMatches(data);
            } else {
                console.error("❌ Chyba pri načítaní zápasov:", await response.text());
            }
        } catch (err) {
            console.error("❌ Fetch error:", err);
        } finally {
            if (!isRefresh) setLoading(false);
            setRefreshing(false);
        }
    };

    // 🔹 Načítaj po prvom otvorení len neodohrané
    useEffect(() => {
        fetchMatches("upcoming");
    }, []);

    // 🔹 Keď sa zmení filter, načítaj znova
    useEffect(() => {
        fetchMatches(getFilterParam(filter));
    }, [filter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMatches(getFilterParam(filter), true);
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
            {/* 🔹 Filter */}
            <View style={styles.filterRow}>
                {["NEODOHRANÉ", "ODOHRANÉ"].map((f) => (
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

            {/* 🔹 Zápasy podľa kategórií */}
            {Object.entries(grouped).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 30 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 15 }}>{category}</Text>

                    {items.map((m) => {
                        const matchDate = new Date(m.date);

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
});
