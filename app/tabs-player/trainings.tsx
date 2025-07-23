import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { BASE_URL } from '@/hooks/api';
import { useRouter } from 'expo-router';

type Training = {
    id: number;
    description: string;
    date: string;
    location: string;
    category: number;
    category_name: string;
    user_status: "present" | "absent" | "unknown";
};

const getSeasonLabel = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 5 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export default function TrainingsScreen() {
    const { userRoles } = useContext(AuthContext);
    const { fetchWithAuth } = useFetchWithAuth();
    const router = useRouter();

    const playerCategories = userRoles
        .filter((r) => r.role.toLowerCase() === 'hráč' || r.role.toLowerCase() === 'player')
        .map((r) => r.category.name);

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedSeason, setSelectedSeason] = useState<string>(getSeasonLabel(new Date()));

    const fetchTrainings = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/player-trainings/`);
            const data = await res.json();
            // Zoradi od najnovšieho po najstarší
            data.sort((a: Training, b: Training) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrainings(data);
        } catch (err) {
            console.error('Chyba pri načítaní tréningov:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth]);

    useEffect(() => {
        fetchTrainings();
    }, [fetchTrainings]);

    const allSeasons = Array.from(new Set(
        trainings.map((t) => getSeasonLabel(new Date(t.date)))
    )).sort().reverse();

    const trainingsByCategory = playerCategories.reduce((acc, category) => {
        const filtered = trainings.filter((t) => {
            const date = new Date(t.date);
            const matchMonth = selectedMonth === -1 || date.getMonth() === selectedMonth;
            const matchSeason = getSeasonLabel(date) === selectedSeason;
            return t.category_name === category && matchMonth && matchSeason;
        });
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
    }, {} as Record<string, Training[]>);

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    const monthNames = [
        'Jún', 'Júl', 'August', 'September', 'Október', 'November',
        'December', 'Január', 'Február', 'Marec', 'Apríl', 'Máj'
    ];

    const monthIndexes = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

    return (
        <ScrollView style={{ padding: 20, backgroundColor: '#fff' }}>
            <Text style={styles.heading}>📅 Filtrovať podľa mesiaca</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsRow}>
                <TouchableOpacity
                    onPress={() => setSelectedMonth(-1)}
                    style={[styles.monthButton, selectedMonth === -1 && styles.selectedMonth]}
                >
                    <Text style={[styles.monthText, selectedMonth === -1 && styles.selectedMonthText]}>Všetky</Text>
                </TouchableOpacity>
                {monthIndexes.map((index, idx) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedMonth(index)}
                        style={[styles.monthButton, selectedMonth === index && styles.selectedMonth]}
                    >
                        <Text style={[styles.monthText, selectedMonth === index && styles.selectedMonthText]}>{monthNames[idx]}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.yearRow}>
                {allSeasons.map((season) => (
                    <TouchableOpacity
                        key={season}
                        onPress={() => setSelectedSeason(season)}
                        style={[styles.yearButton, selectedSeason === season && styles.selectedYear]}
                    >
                        <Text style={[styles.yearText, selectedSeason === season && styles.selectedYearText]}>{season}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {Object.entries(trainingsByCategory).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 30 }}>
                    <Text style={styles.categoryTitle}>{category}</Text>

                    <View style={styles.statsBox}>
                        {(() => {
                            const total = items.length;
                            const present = items.filter((t) => t.user_status === 'present').length;
                            const absent = items.filter((t) => t.user_status === 'absent').length;
                            const unknown = items.filter((t) => t.user_status === 'unknown').length;
                            const percent = total > 0 ? Math.round((present / total) * 100) : 0;
                            return (
                                <Text style={styles.statsText}>
                                    Účasť: {present}/{total} ({percent}%), ❌ {absent}, ❓ {unknown}
                                </Text>
                            );
                        })()}
                    </View>

                    {items.map((t) => {
                        const date = new Date(t.date);
                        const formatted = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()} • ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        const statusColor = t.user_status === 'present'
                            ? '#4CAF50' : t.user_status === 'absent'
                                ? '#D32F2F' : '#aaa';

                        return (
                            <TouchableOpacity
                                key={t.id}
                                style={styles.trainingCard}
                                onPress={() => router.push({ pathname: '/training/[id]', params: { id: String(t.id) } })}
                            >
                                <Text style={styles.trainingTitle}>{t.description}</Text>
                                <Text style={styles.trainingDetail}>📍 {t.location}</Text>
                                <Text style={styles.trainingDetail}>🕒 {formatted}</Text>
                                <Text style={[styles.status, { color: statusColor }]}>
                                    {t.user_status === 'present' ? '✔️ Zúčastnil si sa' : t.user_status === 'absent' ? '❌ Nezúčastnil si sa' : '❓ Nezodpovedal si'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#111',
    },
    monthsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    monthButton: {
        backgroundColor: '#ccc',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    selectedMonth: {
        backgroundColor: '#D32F2F',
    },
    monthText: {
        color: '#000',
        fontWeight: '600',
    },
    selectedMonthText: {
        color: '#fff',
    },
    yearRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        marginTop: 10,
    },
    yearButton: {
        backgroundColor: '#ccc',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    selectedYear: {
        backgroundColor: '#D32F2F',
    },
    yearText: {
        color: '#000',
        fontWeight: '600',
    },
    selectedYearText: {
        color: '#fff',
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#D32F2F',
    },
    trainingCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    trainingTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
        color: '#000',
    },
    trainingDetail: {
        fontSize: 15,
        color: '#555',
        marginBottom: 4,
    },
    status: {
        fontWeight: 'bold',
        marginTop: 8,
        fontSize: 15,
    },
    statsBox: {
        marginBottom: 10,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 8,
    },
    statsText: {
        fontSize: 15,
        color: '#333',
        fontStyle: 'italic',
    },
});