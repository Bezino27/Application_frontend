import React, { useEffect, useState, useCallback, useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    ImageBackground,
    Image,
    Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";

interface User {
    id: number;
    username: string;
    full_name: string;
    last_message_timestamp?: string;
    has_unread?: boolean;
    number: number;
}

export default function ChatUserList() {
    const { fetchWithAuth } = useFetchWithAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const { isLoggedIn, accessToken } = useContext(AuthContext);

    const filterUsers = (text: string, allUsers: User[]) => {
        const lower = text.toLowerCase();
        const filtered = allUsers.filter(
            (u) =>
                u.full_name.toLowerCase().includes(lower) ||
                u.username.toLowerCase().includes(lower)
        );
        setFilteredUsers(filtered);
    };

    useFocusEffect(
        useCallback(() => {
            if (!isLoggedIn || !accessToken) return; // ← zabráni zbytočnému fetchu

            const fetchUsers = async () => {
                setLoading(true);
                try {
                    const res = await fetchWithAuth(`${BASE_URL}/chat-users/`);
                    if (!res.ok) throw new Error("Chyba odpovede");

                    const data = await res.json();
                    setAllUsers(data);
                    setRecentUsers(data.filter((u: User) => u.last_message_timestamp));
                    setFilteredUsers(data.filter((u: User) => u.last_message_timestamp));
                } catch (error) {
                    console.error("❌ Chyba pri načítaní používateľov:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchUsers();
        }, [isLoggedIn, accessToken])
    );

    useEffect(() => {
        if (search.trim() === "") {
            setFilteredUsers(recentUsers); // ⬅️ len tých s ktorými písal
        } else {
            filterUsers(search, allUsers); // ⬅️ všetci z backendu
        }
    }, [search, users]);

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#D32F2F" />
                <Text style={{ marginTop: 10 }}>Načítavam používateľov...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{flex:1, backgroundColor:'white'}} edges={["left", "right", "bottom"]}>
            <View style={styles.container}>

                <TextInput
                    style={styles.searchInput}
                    placeholder="Hľadať meno alebo používateľa..."
                    value={search}
                    onChangeText={setSearch}
                />

                <ScrollView style={{ flex: 1 }}>
                    {filteredUsers.map((user) => (
                        <TouchableOpacity
                            key={user.id}
                            onPress={() =>
                                router.push({
                                    pathname: `/chat/${user.id}`,
                                    params: { name: encodeURIComponent(user.full_name) },
                                })
                            }
                        >
                            <ImageBackground
                                source={require("@/assets/images/DMpozadie.png")} // ← cesta k tvojmu obrázku
                                style={[styles.userCard, user.has_unread && styles.highlightedCard]}
                                imageStyle={{ borderRadius: 12 }}
                            >
                                <View style={styles.avatarCircle}>
                                    <View style={{ position: 'relative', width: 60, height: 60 }}>
                                        <Image
                                            source={require('@/assets/images/dres_final.png')} // ← tu bude tvoj obrázok dresu
                                            style={{ width: 60, height: 60, opacity: 0.5 }}
                                        />
                                        <Text style={{
                                            position: 'absolute',
                                            top: 15,
                                            left: 0,
                                            right: 0,
                                            textAlign: 'center',
                                            fontSize: 20,
                                            fontWeight: 'bold',
                                            color: '#fff',
                                        }}>
                                            {user.number}
                                        </Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.userName}>{user.full_name}</Text>
                                    <Text style={styles.username}>@{user.username}</Text>
                                    {user.last_message_timestamp && (
                                        <Text style={styles.timestamp}>
                                            Posledná správa:{" "}
                                            {new Date(user.last_message_timestamp).toLocaleString("sk-SK", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                            })}
                                        </Text>
                                    )}
                                </View>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
const screenWidth = Dimensions.get("window").width;
const isSmallDevice = screenWidth < 380;

const styles = StyleSheet.create({
    container: {
        padding: isSmallDevice ? 10 : 20,
        backgroundColor: "#fff",
        flex: 1,
    },
    searchInput: {
        backgroundColor: "#f0f0f0",
        borderRadius: 10,
        paddingHorizontal: isSmallDevice ? 10 : 15,
        paddingVertical: isSmallDevice ? 8 : 10,
        marginBottom: 20,
        fontSize: isSmallDevice ? 14 : 16,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fafafa",
        padding: isSmallDevice ? 10 : 16,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    userName: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: "600",
        color: "#111",
    },
    username: {
        fontSize: isSmallDevice ? 12 : 14,
        color: "#555",
    },
    timestamp: {
        fontSize: isSmallDevice ? 11 : 12,
        color: "#999",
        marginTop: 4,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: isSmallDevice ? 8 : 12,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#D32F2F",
    },

    highlightedCard: {
        backgroundColor: "#ffeaea",
        borderColor: "#D32F2F",
        borderWidth: 1,
    },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
});