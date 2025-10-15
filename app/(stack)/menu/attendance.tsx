import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { BASE_URL } from '@/hooks/api';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function AttendanceScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { isLoggedIn, accessToken } = useContext(AuthContext);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(""); 
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!isLoggedIn || !accessToken) return;

        const fetchData = async () => {
            try {
                const res = await fetchWithAuth(`${BASE_URL}/coach-attendance-summary/`);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error('❌ Attendance load error', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isLoggedIn, accessToken]);

    const allCategories = Array.from(
        new Set(
            data.flatMap(p => p.categories.map((c: any) => c.category_name))
        )
    );

    const handleCategoryChange = (cat: string | null) => {
        setSelectedCategory(cat);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const filtered = (selectedCategory
        ? data.filter(player =>
            player.categories.some((c: any) => c.category_name === selectedCategory)
        )
        : data
    ).filter(player => {
        const q = searchQuery.toLowerCase();
        return (
            player.name.toLowerCase().includes(q) ||
            String(player.number || "").includes(q)
        );
    });

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <ScrollView 
            style={{ flex: 1, backgroundColor: '#fff' }}
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            {/* Filtre podľa kategórií */}
            <ScrollView 
                horizontal 
                style={styles.headerScroll} 
                contentContainerStyle={{ padding: 10 }}
                showsHorizontalScrollIndicator={false}
            >
                <TouchableOpacity 
                    onPress={() => handleCategoryChange(null)} 
                    style={[styles.filterItem, selectedCategory === null && styles.activeFilter]}
                >
                    <Text style={styles.filterText}>Všetky</Text>
                </TouchableOpacity>
                {allCategories.map(cat => (
                    <TouchableOpacity 
                        key={cat} 
                        onPress={() => handleCategoryChange(cat)} 
                        style={[styles.filterItem, selectedCategory === cat && styles.activeFilter]}
                    >
                        <Text style={styles.filterText}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 🔍 Search bar */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Hľadaj hráča podľa mena alebo čísla..."
                    placeholderTextColor="#777"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Zoznam hráčov */}
            <View style={{ paddingHorizontal: 20 }}>
                {filtered.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#666' }}>Žiadni hráči nevyhovujú filtrom</Text>
                ) : (
                    [...filtered]
                        .sort((a, b) => {
                            const numA = parseInt(a.number) || 0;
                            const numB = parseInt(b.number) || 0;
                            return numB - numA;
                        })
                        .map(player => {
                            const attendancePercent = selectedCategory
                                ? player.categories.find((c: any) => c.category_name === selectedCategory)?.attendance_percentage || 0
                                : player.overall_attendance;

                            return (
                                <TouchableOpacity
                                    key={player.player_id}
                                    style={styles.card}
                                    onPress={() => router.push({ pathname: '/player/[id]', params: { id: String(player.player_id) } })}
                                >
                                    <Text style={styles.name}>{player.name} #{player.number}</Text>
                                    <Text style={styles.sub}>{player.position || 'Bez pozície'}</Text>
                                    <View style={styles.progressBarWrap}>
                                        <View style={[styles.progressBarFill, { width: `${attendancePercent}%` }]} />
                                    </View>
                                    <Text style={styles.percentText}>{attendancePercent.toFixed(1)}%</Text>
                                </TouchableOpacity>
                            );
                        })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    headerScroll: {
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderColor: '#ccc',
        height: 50,
    },
    filterItem: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#eee',
        borderRadius: 20,
        marginRight: 10,
        height: 30,
    },
    activeFilter: {
        backgroundColor: '#D32F2F',
    },
    filterText: {
        color: '#000',
        fontWeight: 'bold',
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        color: '#000',
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 15,
        borderRadius: 10,
        elevation: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
        color: '#000',
    },
    sub: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    progressBarWrap: {
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#D32F2F',
    },
    percentText: {
        marginTop: 5,
        fontSize: 13,
        color: '#444',
    },
});
