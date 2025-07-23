import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type Player = {
    id: number;
    name: string;
    number?: number;
    birth_date?: string; };

type TrainingDetail = {
    id: number;
    description: string;
    date: string;
    location: string;
    created_by: string;
    players: {
        present: Player[];
        absent: Player[];
        unknown: Player[];
    };
};

export default function TrainingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { fetchWithAuth } = useFetchWithAuth();
    const router = useRouter();

    const [training, setTraining] = useState<TrainingDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchWithAuth(`${BASE_URL}/training-detail/${id}/`);
                const data = await res.json();
                setTraining(data);
            } catch (err) {
                console.error("❌ Chyba pri načítaní detailu tréningu:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) void load();
    }, [id, fetchWithAuth]);

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
    if (!training)
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Tréning nebol nájdený.</Text>
            </View>
        );

    const formattedDate = new Date(training.date).toLocaleString("sk-SK", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.push("/tabs-player/news"); // ← alebo kam chceš nasmerovať späť
                        }
                    }}
                >
                </TouchableOpacity>

                <View style={styles.card}>
                    <Text style={styles.title}>{training.description || "Tréning"}</Text>
                    <Text style={styles.detail}>📅 {formattedDate}</Text>
                    <Text style={styles.detail}>📍 {training.location}</Text>
                    <Text style={styles.detail}>👤 Vytvoril: {training.created_by}</Text>
                </View>

                {["present", "absent", "unknown"].map((statusKey) => {
                    const statusMap = {
                        present: "✅ Prídu",
                        absent: "❌ Neprídu",
                        unknown: "❓ Nezodpovedané",
                    };

                    const players = training.players[statusKey as keyof typeof training.players];

                    return (
                        <View key={statusKey} style={styles.section}>
                            <Text style={styles.sectionTitle}>{statusMap[statusKey as keyof typeof statusMap]}</Text>
                            {players.length === 0 ? (
                                <Text style={styles.noPlayer}>– nikto –</Text>
                            ) : (
                                players.map((p) => {
                                    const colorStyle =
                                        statusKey === "present"
                                            ? styles.green
                                            : statusKey === "absent"
                                                ? styles.red
                                                : styles.gray;

                                    const year = p.birth_date ? ` (${p.birth_date.slice(0, 4)})` : "";
                                    const number = p.number ? `${p.number}` : "–";

                                    return (
                                        <View key={p.id} style={styles.playerRow}>
                                            <Text style={[styles.playerNumber, colorStyle]}>{number}</Text>
                                            <Text style={[styles.playerName, colorStyle]}>
                                                {p.name}{year}
                                            </Text>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#e0e0e0", // pozadie ladí s appkou
    },

    playerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "#f5f5f5",
        marginBottom: 6,
        borderRadius: 8,
    },
    playerNumber: {
        width: 32,
        fontWeight: "bold",
        fontSize: 16,
    },
    playerName: {
        fontSize: 16,
        marginLeft: 10,
    },

    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 0,
        backgroundColor: "#e0e0e0", // svetlošedé pozadie aplikácie
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#111",
    },
    detail: {
        fontSize: 16,
        marginBottom: 6,
        color: "#444",
    },
    section: {
        marginBottom: 25,
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#111",
    },
    playerCard: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginBottom: 8,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    noPlayer: {
        fontSize: 16,
        fontStyle: "italic",
        color: "#999",
        marginLeft: 12,
    },
    errorText: {
        padding: 20,
        textAlign: "center",
        color: "#D32F2F",
        fontSize: 16,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backText: {
        color: "#D32F2F",
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 6,
    },
    playerText: {
        fontSize: 16,
        marginLeft: 12,
        marginBottom: 4,
    },
    green: {
        color: "#4CAF50",
    },
    red: {
        color: "#D32F2F",
    },
    gray: {
        color: "#555",
    },
});