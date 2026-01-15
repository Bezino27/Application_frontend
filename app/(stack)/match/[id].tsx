// KOMPLETNÁ REVIDOVANÁ VERZIA S NOMINÁCIOU A ÚPRAVOU ZÁPASU

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

export default function MatchDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { fetchWithAuth } = useFetchWithAuth();
    const router = useRouter();
    const { userRoles } = useContext(AuthContext);
    const [match, setMatch] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentRole } = useContext(AuthContext);
    const isCoach =
        currentRole?.role === "coach" ;
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetchWithAuth(`${BASE_URL}/match-detail/${id}/`);
                const data = await res.json();
                setMatch(data);
            } catch (err) {
                console.error("❌ Chyba pri načítaní zápasu:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id]);

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
    if (!match)
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Zápas nebol nájdený.</Text>
            </View>
        );

    const formattedDate = new Date(match.date).toLocaleString("sk-SK", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });


    const startMatch = () => {
        Alert.alert("Zahájenie zápasu", "Zápas bol zahájený! (Tu môžeš neskôr spustiť čas, štatistiky, atď)");
    };

    const deleteMatch = async () => {
        Alert.alert("Zmazať zápas?", "Naozaj chceš zmazať tento zápas?", [
            { text: "Zrušiť", style: "cancel" },
            {
                text: "Zmazať",
                style: "destructive",
                onPress: async () => {
                    try {
                        const res = await fetchWithAuth(`${BASE_URL}/matches/delete/${match.id}/`, {
                            method: "DELETE",
                        });

                        if (!res.ok) throw new Error("Nepodarilo sa zmazať zápas");

                        Alert.alert("✅ Zmazané", "Zápas bol zmazaný");
                        router.back();
                    } catch (err) {
                        Alert.alert("Chyba", "Nepodarilo sa zmazať zápas");
                    }
                },
            },
        ]);
    };
    const isPastMatch = new Date(match.date) < new Date();
    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (router.canGoBack()) router.back();
                        else router.push("/tabs-player/news");
                    }}
                />

                <View style={styles.card}>
                    <Text style={styles.title}>{match.category_name} – {match.opponent}</Text>
                    <Text style={styles.detail}>📅 {formattedDate}</Text>
                    <Text style={styles.detail}>📍 {match.location}</Text>
                    {match.description && <Text style={styles.detail}>{match.description}</Text>}
                    {/* 🎥 Odkaz na video zo zápasu */}
                    {match.video_link ? (
                    <TouchableOpacity
                        onPress={() => {
                        try {
                            const link = match.video_link.startsWith("http")
                            ? match.video_link
                            : `https://${match.video_link}`;
                            import("expo-linking").then(({ openURL }) => openURL(link));
                        } catch (e) {
                            Alert.alert("Chyba", "Nepodarilo sa otvoriť odkaz.");
                        }
                        }}
                        style={styles.videoLinkButton}
                    >
                        <Text style={styles.videoLinkText}>🎥 Video zo zápasu</Text>
                    </TouchableOpacity>
                    ) : null}
                    {isCoach && (
                        <View style={{ marginTop: 20, gap: 12 }}>

                            {match.nominations_created && (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => router.push(`/match/stats/${match.id}`)}

                                >
                                    <Text style={styles.buttonText}>📊 Zadať štatistiky</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => router.push(`/match/edit/${match.id}`)}
                            >
                                <Text style={styles.buttonText}>📝 Upraviť zápas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => router.push(`/match/nominations/${match.id}`)}
                            >
                                <Text style={styles.buttonText}>📝 Spravovať nomináciu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#D32F2F' }]}
                                onPress={deleteMatch}
                            >
                                <Text style={styles.buttonText}>🗑️ Zmazať zápas</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {!match.nominations_created ? (
                    <>
                        <Text style={styles.sectionTitle}>Zápas zatiaľ nemá zverejnenú nomináciu.</Text>

                        {["players_present", "players_absent", "players_unknown"].map((statusKey) => {
                            const statusMap: Record<string, string> = {
                                players_present: "🟢 Môžu prísť",
                                players_absent: "🔴 Nemôžu prísť",
                                players_unknown: "⚫ Nehlasovali",
                            };

                            const players = match[statusKey];

                            return (
                                <View key={statusKey} style={styles.card}>
                                    {/* 🔔 Pripomienka pre nehlasujúcich */}
                                    {statusKey === "players_unknown" && players.length > 0 && isCoach && !isPastMatch && (
                                        <TouchableOpacity
                                            style={styles.remindButton}
                                            onPress={async () => {
                                                try {
                                                    const res = await fetch(`${BASE_URL}/remind-match-attendance/`, {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                            Authorization: `Bearer ${await AsyncStorage.getItem("access")}`,
                                                        },
                                                        body: JSON.stringify({
                                                            match_id: match.id,
                                                            user_ids: players.map((p: any) => p.user_id),
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
                                        {statusMap[statusKey]} ({players.length})
                                    </Text>

                                    {players.length === 0 ? (
                                        <Text style={styles.noPlayer}>– nikto –</Text>
                                    ) : (
                                        players.map((p: any) => (
                                        <View key={p.user_id} style={styles.playerRow}>
                                            <Text style={styles.playerNumber}>{p.number || "–"}</Text>

                                            <View style={{ flex: 1 }}>
                                            <Text style={styles.playerName}>
                                                {p.name} {p.birth_date ? `(${p.birth_date.slice(6, 10)})` : ""}
                                            </Text>
                                            {p.reason && (
                                                <Text style={styles.reasonText}>Dôvod: {p.reason}</Text>
                                            )}
                                            </View>
                                        </View>
                                        ))
                                    )}
                                </View>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {/* Tu neskôr pridáme sekcie pre nominovaných hráčov (confirmed / declined), náhradníkov a nenominovaných */}
                        <Text style={styles.sectionTitle}>🟢 Zverejnená nominácia</Text>

                        {["starter", "substitute"].map((type) => {
                            const titleMap: Record<string, string> = {
                                starter: "Základná zostava",
                                substitute: "🟡 Náhradníci"
                            };

                            const players = match.nominations.filter(
                                (p: any) => p.is_substitute === (type === "substitute")
                            );

                            return (
                                <View key={type} style={styles.card}>
                                    <Text style={styles.sectionTitle}>
                                        {titleMap[type]} ({players.length})
                                    </Text>

                                    {players.length === 0 ? (
                                        <Text style={styles.noPlayer}>– nikto –</Text>
                                    ) : (
                                        players.map((p: any) => (
                                            <View key={p.user_id} style={styles.playerRow}>
                                                <Text style={styles.playerNumber}>{p.number || "–"}</Text>
                                                <Text style={[styles.playerName, { flex: 1 }]}>
                                                    {p.name}
                                                    {p.birth_date ? ` (${p.birth_date.slice(6, 10)})` : ""}
                                                </Text>

                                                {isCoach && (
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={styles.statsText}>⭐ {p.rating ?? '-'}</Text>
                                                        <Text style={styles.statsText}>+/- {p.plus_minus ?? 0}</Text>
                                                    </View>
                                                )}

                                                <Text style={styles.confirmationStatus}>
                                                    {p.confirmed === true && "🟢"}
                                                    {p.confirmed === false && "🔴"}
                                                    {p.confirmed === null && "⚫"}
                                                </Text>
                                            </View>
                                        ))
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#e0e0e0",
    },
    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 0,
        backgroundColor: "#e0e0e0",
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
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#111",
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
        marginLeft: 0,
    },
    noPlayer: {
        fontSize: 16,
        fontStyle: "italic",
        color: "#999",
        marginLeft: 12,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    errorText: {
        padding: 20,
        textAlign: "center",

        color: "#D32F2F",
        fontSize: 16,
    },
    button: {
        backgroundColor: '#1976D2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmationStatus: {
        marginLeft: 8,
        fontSize: 18,
    },
    statsText: {
        fontSize: 14,
        color: "#555",
        textAlign: "right",
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
    videoLinkButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    },
    videoLinkText: {
    color: "#1976D2",
    fontWeight: "600",
    fontSize: 16,
    textDecorationLine: "underline",
    },
    reasonText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
    },  
});