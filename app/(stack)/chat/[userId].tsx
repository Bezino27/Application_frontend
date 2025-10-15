// ChatScreen.tsx
import React, { useState, useEffect, useContext, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ImageBackground,
    Keyboard,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function ChatScreen() {
    const { userDetails } = useContext(AuthContext);
    const { fetchWithAuth } = useFetchWithAuth();
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const rawParams = useLocalSearchParams();
    const userId = Number(rawParams.userId);
    const userName = decodeURIComponent((rawParams.name as string) ?? "Používateľ");

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialScrollDone, setInitialScrollDone] = useState(false);

    const fetchMessages = async (newOffset = 0, append = false) => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/chat/${userId}/?offset=${newOffset}&limit=${PAGE_SIZE}`);
            if (!res.ok) return;

            const data = await res.json();
            if (append) {
                setMessages((prev) => {
                    const existingIds = new Set(prev.map((msg) => msg.id));
                    const filtered = data.filter((msg: any) => !existingIds.has(msg.id));
                    return [...filtered, ...prev];
                });
            } else {
                setMessages(data);
                setInitialScrollDone(false);
            }

            if (data.length < PAGE_SIZE) setHasMore(false);
            setOffset(newOffset + data.length);
        } catch (error) {
            console.error("❌ Chyba pri načítaní správ:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (userDetails?.id) {
            fetchMessages(0, false);
        }
    }, [userId, userDetails]);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!messages.length) return;

            const lastMessage = messages[messages.length - 1];
            try {
                const res = await fetchWithAuth(`${BASE_URL}/chat/${userId}/?offset=0&limit=10`);
                if (!res.ok) return;
                const data = await res.json();

                const newOnes = data.filter(
                    (m: any) => m.id !== lastMessage.id && !messages.find((msg) => msg.id === m.id)
                );

                if (newOnes.length > 0) {
                    setMessages((prev) => [...prev, ...newOnes]);
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            } catch (err) {
                console.warn("❌ Nepodarilo sa načítať nové správy", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [messages, userId]);

    useEffect(() => {
        if (!initialScrollDone && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
                setInitialScrollDone(true);
            }, 200);
        }
    }, [messages]);

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => showSub.remove();
    }, []);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const msg = newMessage.trim();
        setNewMessage("");

        const tempId = Date.now();
        const tempMessage = {
            id: tempId,
            sender: userDetails?.id,
            recipient: userId,
            text: msg,
            timestamp: new Date().toISOString(),
            isTemporary: true,
        };

        setMessages((prev) => [...prev, tempMessage]);

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            const res = await fetchWithAuth(`${BASE_URL}/chat/${userId}/`, {
                method: "POST",
                body: JSON.stringify({ recipient: userId, text: msg }),
            });

            if (res.ok) {
                const serverMsg = await res.json();

                setMessages((prev) => {
                    const withoutTemp = prev.filter(
                        (m) => !(m.isTemporary && m.text === msg && m.sender === userDetails?.id)
                    );
                    return [...withoutTemp, serverMsg];
                });

            } else {
                const text = await res.text();
                console.error(`❌ Server nevrátil správu: ${res.status} - ${text}`);
            }
        } catch (error) {
            console.error("❌ Chyba pri odosielaní správy:", error);
        }
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (e.nativeEvent.contentOffset.y < 30 && hasMore && !loadingMore) {
            setLoadingMore(true);
            fetchMessages(offset, true);
        }
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const isMe = item.sender === userDetails?.id;
        const showDateHeader = index === 0 ||
            new Date(item.timestamp).toDateString() !== new Date(messages[index - 1]?.timestamp).toDateString();

        return (
            <View>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>
                            {new Date(item.timestamp).toLocaleDateString("sk-SK", {
                                day: "2-digit", month: "long", year: "numeric",
                            })}
                        </Text>
                    </View>
                )}

                <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                    <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
                    <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
                        {new Date(item.timestamp).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{flex:1, backgroundColor:'white'}} edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loading}><ActivityIndicator size="large" color="#D32F2F" /></View>
                ) : (
                    <ImageBackground
                        source={require('@/assets/images/spravy_pozadie.png')}
                        style={{ flex: 1 }}
                        imageStyle={{ resizeMode: 'contain'}}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            onScroll={handleScroll}
                            contentContainerStyle={styles.messagesContainer}
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />
                    </ImageBackground>
                )}

                <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 8 }]}>
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Napíš správu..."
                        placeholderTextColor="#999"
                        multiline={true}
                        textAlignVertical="top"
                        blurOnSubmit={false}
                        onFocus={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }, 150);
                        }}
                    />
                    <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    messagesContainer: { padding: 16 },
    messageBubble: {
        maxWidth: "80%",
        padding: 12,
        marginBottom: 10,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    myMessage: {
        backgroundColor: "#808080",
        alignSelf: "flex-end",
        borderTopRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: "#fff",
        alignSelf: "flex-start",
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    messageText: { fontSize: 16, color: "#111" },
    myMessageText: { color: "#fff" },
    timestamp: {
        fontSize: 12,
        color: "#777",
        marginTop: 6,
        textAlign: "right",
    },
    myTimestamp: { color: "#ddd" },
    inputContainer: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",
    },
    input: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
        maxHeight: 120,
        minHeight: 44,
    },
    sendButton: {
        backgroundColor: "#D32F2F",
        padding: 12,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    dateHeader: { alignItems: "center", marginVertical: 10 },
    dateHeaderText: {
        fontSize: 14,
        color: "#888",
        backgroundColor: "#e0e0e0",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
});
