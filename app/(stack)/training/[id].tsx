import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useContext } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';


type Player = {
    id: number;
    name: string;
    number?: number;
    birth_date?: string;
    position?: string;
    reason?:string;
    responded_at?: string; 

};

type TrainingDetail = {
    id: number;
    description: string;
    date: string;
    location: string;
    created_by: string;
    category_id: number;  // ← pridaj toto
    category_name: string; // ← pridaj toto!
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
    const { userRoles } = useContext(AuthContext);
    const [training, setTraining] = useState<TrainingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentRole } = useContext(AuthContext);

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





    const normalize = (text?: string) =>
        text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const isCoachOfCategory = currentRole?.role === "coach" ;
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

                    {isCoachOfCategory && (
                        <View style={styles.coachControls}>
                            <TouchableOpacity
                            style={styles.manageButton}
                            onPress={() =>
                                router.push({
                                pathname: `/formations_overview/[trainingId]`,
                                params: {
                                    trainingId: training.id.toString(),
                                    categoryId: training.category_id.toString(),
                                },
                                })
                            }
                            >
                            <Text style={styles.manageButtonText}>🧩 Zobraziť formácie</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push(`/training/edit/${training.id}`)}
                            >
                                <Text style={styles.manageButtonText}>🛠️ Upraviť tréning</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.manageButton}
                                onPress={() => router.push(`/training/manage/${training.id}`)}
                            >
                                <Text style={styles.manageButtonText}>📝 Spravovať účasť</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    Alert.alert(
                                        "Zmazať tréning?",
                                        "Naozaj chceš zmazať tento tréning? Táto akcia je nevratná.",
                                        [
                                            { text: "Zrušiť", style: "cancel" },
                                            {
                                                text: "Zmazať",
                                                style: "destructive",
                                                onPress: async () => {
                                                    try {
                                                        const res = await fetch(`${BASE_URL}/training/${training.id}/`, {
                                                            method: "DELETE",
                                                            headers: {
                                                                Authorization: `Bearer ${await AsyncStorage.getItem("access")}`,
                                                            },
                                                        });

                                                        if (!res.ok) throw new Error("Chyba pri mazaní");

                                                        Alert.alert("✅ Zmazané", "Tréning bol úspešne zmazaný.");
                                                        router.back();
                                                    } catch (err) {
                                                        console.error("❌ Chyba pri mazaní tréningu:", err);
                                                        Alert.alert("Chyba", "Nepodarilo sa zmazať tréning.");
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }}
                            >
                                <Text style={styles.deleteButtonText}>🗑️ Zmazať tréning</Text>
                            </TouchableOpacity>

                        </View>
                    )}
                </View>

                {["present", "absent", "unknown"].map((statusKey) => {
                    const statusMap = {
                        present: "🟢 Prídu",
                        absent: "🔴 Neprídu",
                        unknown: "⚫ Nezodpovedané",
                    };

                    const players = training.players[statusKey as keyof typeof training.players];

                    // Rozdelenie prítomných na hráčov vs. brankárov
                    let fieldPlayers = players;
                    let goalies = 0;

                    if (statusKey === "present") {
                        goalies = players.filter(p =>
                            p.position?.toLowerCase().includes("brankár")
                        ).length;
                        fieldPlayers = players.filter(p =>
                            !p.position?.toLowerCase().includes("brankár")
                        );
                    }

                    const countLabel =
                        statusKey === "present"
                            ? `${fieldPlayers.length}+${goalies}`
                            : `${players.length}`;
                    const isPastTraining = new Date(training.date) < new Date();
                    return (
                        <View key={statusKey} style={styles.card}>
                            {statusKey === "unknown" &&
                                players.length > 0 &&
                                isCoachOfCategory &&
                                !isPastTraining && (
                                    <TouchableOpacity
                                        style={styles.remindButton}
                                        onPress={async () => {
                                            try {
                                                const res = await fetch(`${BASE_URL}/remind-attendance/`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        Authorization: `Bearer ${await AsyncStorage.getItem("access")}`,
                                                    },
                                                    body: JSON.stringify({
                                                        training_id: training.id,
                                                        user_ids: players.map(p => p.id),
                                                    }),
                                                });

                                                if (!res.ok) throw new Error("Chyba pri odosielaní pripomienky");
                                                Alert.alert("✅ Odoslané", "Pripomienka bola odoslaná hráčom.");
                                            } catch (e) {
                                                console.error("❌ Pripomienka sa nepodarila:", e);
                                                Alert.alert("Chyba", "Nepodarilo sa odoslať pripomienku.");
                                            }
                                        }}
                                    >
                                        <Text style={styles.remindButtonText}>🔔</Text>
                                    </TouchableOpacity>
                                )}
                            <Text style={styles.sectionTitle}>
                                {statusMap[statusKey as keyof typeof statusMap]} ({countLabel})
                            </Text>

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

                                    // 💥 formátovanie dátumu + času
                                    let formattedTime = null;
                                    if (p.responded_at) {
                                        const d = new Date(p.responded_at);
                                        const date = d.toLocaleDateString("sk-SK", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        });
                                        const time = d.toLocaleTimeString("sk-SK", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        });
                                        formattedTime = `${date} ${time}`;
                                    }

                                    return (
                                        <View key={p.id} style={styles.playerRow}>
                                        <Text style={[styles.playerNumber, colorStyle]}>{number}</Text>
                                        <View style={{ flexDirection: "column", marginLeft: 10 }}>
                                            <Text style={[styles.playerName, colorStyle]}>
                                            {p.name}
                                            {year} - {p.position?.slice(0, 1)}
                                            </Text>


                                            {/* 💬 dôvod neúčasti pod časom (ak je tréner a hráč bol absent) */}
                                            {statusKey === "absent" && p.reason && isCoachOfCategory ? (
                                            <Text style={styles.reason}>{"Dôvod:"}{p.reason}</Text>
                                            ) : null}


                                            {formattedTime && (
                                            <Text style={styles.timeattedance}>
                                                {"hlasoval "}{formattedTime}
                                            </Text>
                                            )}


                                        </View>
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
    coachControls: {
        marginTop: 16,
        gap: 12,
    },

    manageButton: {
        backgroundColor: "#1976D2",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },

    manageButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    deleteButton: {
        backgroundColor: "#D32F2F",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },

    deleteButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    editButton: {
        backgroundColor: "#FFA000", // oranžová
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    remindButton: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    remindButtonText: {
        fontSize: 18,
        color: "#D32F2F",
        fontWeight: "bold",
    },
    formationsButton: {
    backgroundColor: "#388E3C", // zelená, aby sa odlíšila
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
},

respondedTimeText: {
  color: "#555",
  fontStyle: "italic",
  fontSize: 13,
  marginTop: 0,
},

    timeattedance: {
        fontSize: 12,
        marginLeft: 10,
        color: "#555",
    },

    reason:{
        fontSize:14,
        marginLeft: 10,
        color: "#555",

    }
});

