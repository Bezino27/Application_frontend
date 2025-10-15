import React, { useEffect, useState, useContext } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { AuthContext } from '@/context/AuthContext';
import { BASE_URL } from '@/hooks/api';

type Player = {
    id: number;
    name: string;
    birth_date: string;
    categories: string[];
    position?: string | null;
};

type Category = {
    id: number;
    name: string;
};

export default function ManageCategoryScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userRoles } = useContext(AuthContext);

    const coachCategories = userRoles.filter(r => r.role === 'coach').map(r => r.category);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedInCategory, setSelectedInCategory] = useState<number[]>([]);

    const fetchPlayers = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/users-in-club/`);
            const data = await res.json();

            const onlyPlayers: Player[] = data
                .filter((u: any) => u.roles.some((r: any) => r.role === 'player'))
                .map((u: any) => ({
                    id: u.id,
                    name: u.name || u.username,
                    birth_date: u.birth_date,
                    position: u.position,
                    categories: u.roles
                        .filter((r: any) => r.role === 'player')
                        .map((r: any) => r.category__name),
                }));

            setPlayers(onlyPlayers);
        } catch (e) {
            Alert.alert("Chyba", "Nepodarilo sa načítať hráčov.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategory = (cat: Category) => {
        setSelectedCategory(cat);
        const inCategory = players
            .filter(p => p.categories.includes(cat.name))
            .map(p => p.id);
        setSelectedInCategory(inCategory);
    };

    const togglePlayer = (playerId: number) => {
        setSelectedInCategory(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    const handleSave = async () => {
        if (!selectedCategory) return;
        try {
            const res = await fetchWithAuth(`${BASE_URL}/assign-players-to-category/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: selectedCategory.id,
                    player_ids: selectedInCategory,
                }),
            });

            if (!res.ok) throw new Error();

            Alert.alert("✅ Uložené", "Hráči boli priradení.");

            await fetchPlayers(); // refresh po uložení
            handleSelectCategory(selectedCategory); // opätovné načítanie výberu
        } catch (e) {
            Alert.alert("❌ Chyba", "Nepodarilo sa uložiť zmeny.");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPlayers();
        if (selectedCategory) {
            handleSelectCategory(selectedCategory);
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const sortedPlayers = [...players].sort(
        (a, b) => new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime()
    );

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    const playersInCategory = sortedPlayers.filter(p =>
        selectedInCategory.includes(p.id)
    );

    const playersNotInCategory = sortedPlayers.filter(p =>
        !selectedInCategory.includes(p.id)
    );

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <Text style={styles.heading}>Vyber kategóriu</Text>
            <View style={styles.chipRow}>
                {coachCategories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => handleSelectCategory(cat)}
                        style={[
                            styles.chip,
                            selectedCategory?.id === cat.id && styles.chipSelected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                selectedCategory?.id === cat.id && { color: '#fff' },
                            ]}
                        >
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedCategory && (
                <>
                    <Text style={styles.subheading}>👥 Hráči v kategórii {selectedCategory.name}</Text>
                    <View style={styles.dualColumn}>
                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>V kategórii</Text>
                            {playersInCategory.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => togglePlayer(p.id)}
                                    style={[styles.playerBox, styles.inCategory]}
                                >
                                    <Text style={styles.playerText}>{p.name} - {p.position?.slice(0, 1)}</Text>
                                    <Text style={styles.playerTextSecondary}>{p.birth_date?.slice(0, 4)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>Mimo kategórie</Text>
                            {playersNotInCategory.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => togglePlayer(p.id)}
                                    style={[styles.playerBox, styles.notInCategory]}
                                >
                                    <Text style={styles.playerText}>{p.name} - {p.position?.slice(0, 1)}</Text>
                                    <Text style={styles.playerTextSecondary}>{p.birth_date?.slice(0, 4)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>💾 Uložiť zmeny</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f4f4f8' },
    heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        backgroundColor: '#ccc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    chipSelected: { backgroundColor: '#D32F2F' },
    chipText: { fontWeight: '600', color: '#000' },
    subheading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 20,
        color: '#D32F2F',
        textAlign: 'center',
    },
    dualColumn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flex: 1,
        marginHorizontal: 5,
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    playerBox: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
    },
    inCategory: {
        backgroundColor: '#eaffea',
        borderColor: '#4CAF50',
    },
    notInCategory: {
        backgroundColor: '#f2f2f2',
        borderColor: '#aaa',
    },
    playerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
    },
    playerTextSecondary: {
        fontSize: 14,
        color: '#666',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 10,
        marginTop: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
});