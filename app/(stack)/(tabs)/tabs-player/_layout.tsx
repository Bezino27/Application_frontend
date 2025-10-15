// app/(tabs-player)/_layout.tsx
import React, { useCallback, useRef, useState, useContext, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '@/hooks/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
export default function PlayerTabsLayout() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();
    const { isLoggedIn, accessToken } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const insets = useSafeAreaInsets();

    const inflightRef = useRef(false);
    const abortedRef = useRef(false);

    const fetchUnread = useCallback(async () => {
        if (isLoggedIn !== true || !accessToken || inflightRef.current) return;
        inflightRef.current = true;
        try {
            const res = await fetchWithAuth(`${BASE_URL}/chat-users/`);
            if (!res.ok) return;
            const data = await res.json();
            if (abortedRef.current) return;
            const count = data.filter((u: any) => u?.has_unread).length;
            setUnreadCount(count);
        } catch (e) {
            if (!abortedRef.current) console.error("❌ Chyba pri načítaní správ:", e);
        } finally {
            inflightRef.current = false;
        }
    }, [isLoggedIn, accessToken, fetchWithAuth]);

    useFocusEffect(
        useCallback(() => {
            abortedRef.current = false;
            void fetchUnread();
            return () => {
                abortedRef.current = true;
            };
        }, [fetchUnread])
    );

    useEffect(() => {
        if (!isLoggedIn || !accessToken) return;
        const id = setInterval(() => { void fetchUnread(); }, 60000);
        return () => clearInterval(id);
    }, [isLoggedIn, accessToken, fetchUnread]);

    return (
        <View style={{ flex: 1 }}>

        <Tabs
            screenOptions={{
                headerStyle: {
                    height: 40 + insets.top,
                    paddingTop: insets.top,
                    backgroundColor: "#fff",
                },
                headerTitleAlign: "center",
                headerTitleContainerStyle: {
                    justifyContent: "center",
                    alignItems: "center",
                },
                headerTitle: () => (
                    <Image
                        source={require('@/assets/images/moje udalosti.png')}
                        style={{ width: 150, height: 40, resizeMode: 'contain' }}
                    />
                ),

                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.navigate('/(stack)/chat/chat-users')}
                        style={{ paddingRight: 15 }}
                    >
                        <View>
                            <Image
                                source={require('@/assets/images/spravy_logo.png')}
                                style={{ width: 25, height: 35, resizeMode: 'contain' }}
                            />
                            {unreadCount > 0 && (
                                <View style={styles.unreadDot}>
                                    <Text style={styles.unreadText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ),

            }}
        >



            <Tabs.Screen
                name="announcements"
                options={{
                    title: "Nástenka",
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/nastenka_head.png')}
                            style={{ width: 140, height: 40, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Image
                            source={require('@/assets/images/nastenka.png')}
                            style={{ width: size, height: size, tintColor: color }}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="news"
                options={{
                    title: "Moje Udalosti",
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/moje udalosti.png')}
                            style={{ width: 160, height: 50, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Image
                            source={require('@/assets/images/moje_udalosti_ico.png')}
                            style={{ width: size, height: size, tintColor: color }}
                        />
                    ),
                }}
            />


            <Tabs.Screen
                name="trainings"
                options={{
                    title: "Tréningy",
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/trainings.png')}
                            style={{ width: 180, height: 25, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Image
                            source={require('@/assets/images/trainings_ico.png')}
                            style={{ width: size, height: size, tintColor: color }}
                        />
                    ),
                }}
            />


            <Tabs.Screen
                name="matches"
                options={{
                    title: "Zápasy",
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/matches.png')}
                            style={{ width: 140, height: 40, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Image
                            source={require('@/assets/images/zapasy_full.png')}
                            style={{ width: size, height: size, tintColor: color }}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="menuScreen"
                options={{
                    title: "Menu",
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/menu.png')}
                            style={{ width: 120, height: 20, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="menu" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
        </View>
);
}

const styles = StyleSheet.create({
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: -6,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 3,
        borderRadius: 8,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});