// TrainingsScreen.tsx
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { BASE_URL } from '@/hooks/api';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const monthNames = ['Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December', 'Január', 'Február', 'Marec', 'Apríl', 'Máj'];
const monthIndexes = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

const getSeasonLabel = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 5 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

type Training = {
    id: number;
    description: string;
    date: string;
    location: string;
    category: number;
    category_name: string;
    user_status: 'present' | 'absent' | 'unknown';
    attendance_summary: {
        present: number,
        goalies: number
    }
};

export default function TrainingsScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { isLoggedIn, accessToken } = useContext(AuthContext);
    const router = useRouter();

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedSeason, setSelectedSeason] = useState<string>(getSeasonLabel(new Date()));
    const [seasonPickerVisible, setSeasonPickerVisible] = useState(false);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const inflightRef = useRef(false);
    const abortedRef = useRef(false);

    const fetchTrainings = useCallback(async () => {
        if (inflightRef.current) return;
        inflightRef.current = true;
        try {
            const res = await fetchWithAuth(`${BASE_URL}/coach-trainings/`);
            if (!res.ok) return;
            const data: Training[] = await res.json();
            if (abortedRef.current) return;
            const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrainings(sorted);
        } catch (err) {
            console.error('Chyba pri načítaní tréningov:', err);
        } finally {
            inflightRef.current = false;
            if (!abortedRef.current) setLoading(false);
        }
    }, [fetchWithAuth]);

    useEffect(() => {
        if (!isLoggedIn || !accessToken) {
            setLoading(false);
            return;
        }
        abortedRef.current = false;
        void fetchTrainings();
        return () => {
            abortedRef.current = true;
        };
    }, [isLoggedIn, accessToken, fetchTrainings]);

    const allSeasons = Array.from(new Set(trainings.map(t => getSeasonLabel(new Date(t.date))))).sort().reverse();
    const allCategories = Array.from(new Set(trainings.map(t => t.category_name)));

    const passesFilter = (t: Training) => {
        const d = new Date(t.date);
        const monthOK = selectedMonth === -1 || d.getMonth() === selectedMonth;
        const seasonOK = getSeasonLabel(d) === selectedSeason;
        const categoryOK = selectedCategory === null || t.category_name === selectedCategory;
        return monthOK && seasonOK && categoryOK;
    };

    const filteredTrainings = trainings.filter(passesFilter);

    const renderTrainingCard = (t: Training) => {
        const dateObj = new Date(t.date);
        const formattedDate = dateObj.toLocaleDateString('sk-SK', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const formattedTime = dateObj.toLocaleTimeString('sk-SK', {
            hour: '2-digit', minute: '2-digit', hour12: false,
        });

        return (
            <TouchableOpacity
                key={t.id}
                style={styles.trainingCard}
                onPress={() => router.push({ pathname: '/training/[id]', params: { id: String(t.id) } })}
            >
                <View style={styles.titleRow}>
                    <Text style={styles.trainingTitle}>
                        {t.description || 'Tréning'}
                    </Text>
                    <Text style={styles.counts}>
                        {t.attendance_summary.present} + {t.attendance_summary.goalies}
                    </Text>
                </View>

                <Text style={styles.trainingDetail}>
                    {formattedTime} • {formattedDate}
                </Text>

                <View style={styles.trainingInfoRow}>
                    <Text style={styles.trainingIcon}>📍</Text>
                    <Text style={styles.trainingInfo}>{t.location}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: '#f4f4f8' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSeasonPickerVisible(true)} style={styles.filterItem}><Text style={styles.season}>{selectedSeason}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setMonthPickerVisible(true)} style={styles.filterItem}><Text style={styles.season}>{selectedMonth === -1 ? 'Všetky' : monthNames[monthIndexes.indexOf(selectedMonth)]}</Text></TouchableOpacity>
            </View>

            {allCategories.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    <TouchableOpacity onPress={() => setSelectedCategory(null)} style={[styles.filterItem, selectedCategory === null && styles.activeFilter]}>
                        <Text style={styles.season}>Všetky</Text>
                    </TouchableOpacity>
                    {allCategories.map(cat => (
                        <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.filterItem, selectedCategory === cat && styles.activeFilter]}>
                            <Text style={styles.season}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <ScrollView style={{ padding: 20 }}>
                {selectedCategory === null
                    ? Object.entries(filteredTrainings.reduce<Record<string, Training[]>>((acc, curr) => {
                        if (!acc[curr.category_name]) acc[curr.category_name] = [];
                        acc[curr.category_name].push(curr);
                        return acc;
                    }, {})).map(([categoryName, trainings]) => (
                        <View key={categoryName} style={{ marginBottom: 20 }}>
                            <Text style={styles.categoryTitle}>{categoryName}</Text>
                            {trainings.map(renderTrainingCard)}
                        </View>
                    ))
                    : filteredTrainings.map(renderTrainingCard)}
            </ScrollView>

            <Modal visible={seasonPickerVisible} animationType="fade" transparent>
                <Pressable style={styles.modalOverlay} onPress={() => setSeasonPickerVisible(false)}>
                    <Pressable style={styles.pickerModal}>
                        {allSeasons.map(season => (
                            <TouchableOpacity key={season} onPress={() => { setSelectedSeason(season); setSeasonPickerVisible(false); }}>
                                <Text style={[styles.drawerText, season === selectedSeason && { fontWeight: 'bold' }]}>{season}</Text>
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={monthPickerVisible} animationType="fade" transparent>
                <Pressable style={styles.modalOverlay} onPress={() => setMonthPickerVisible(false)}>
                    <Pressable style={styles.pickerModal}>
                        <ScrollView>
                            <TouchableOpacity onPress={() => { setSelectedMonth(-1); setMonthPickerVisible(false); }}>
                                <Text style={[styles.drawerText, selectedMonth === -1 && { fontWeight: 'bold' }]}>Všetky</Text>
                            </TouchableOpacity>
                            {monthIndexes.map((index, idx) => (
                                <TouchableOpacity key={index} onPress={() => { setSelectedMonth(index); setMonthPickerVisible(false); }}>
                                    <Text style={[styles.drawerText, selectedMonth === index && { fontWeight: 'bold' }]}>{monthNames[idx]}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    categoryScroll: {
        flexGrow: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        height: '7%',
    },
    filterItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#eee',
        marginRight: 8,
    },
    activeFilter: {
        backgroundColor: '#D32F2F',
    },
    season: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        gap: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000'
    },
    trainingCard: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    trainingTitle: { fontSize: 20, fontWeight: 'bold', color: '#8C1919', marginBottom: 6 },
    trainingDetail: { color: '#555', marginBottom: 4, fontSize: 17, fontWeight: 'bold' },
    trainingInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 5 },
    trainingIcon: { fontSize: 16, color: '#D32F2F'},
    trainingInfo: { fontSize: 16, color: '#333' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    pickerModal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: 300,
        maxHeight: 600,
        alignItems: 'center',
    },
    drawerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        padding: 8,
        alignSelf: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    counts: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8C1919',
    },
});
