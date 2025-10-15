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
};

export default function TrainingsScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { isLoggedIn, accessToken } = useContext(AuthContext);
    const router = useRouter();

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔧 chýbajúce stavy pre filtre a modaly
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedSeason, setSelectedSeason] = useState<string>(getSeasonLabel(new Date()));
    const [seasonPickerVisible, setSeasonPickerVisible] = useState(false);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    // guards proti pretekaniu requestov a zápisom po unmount-e
    const inflightRef = useRef(false);
    const abortedRef = useRef(false);

    const fetchTrainings = useCallback(async () => {
        if (inflightRef.current) return; // už beží
        inflightRef.current = true;
        try {
            const res = await fetchWithAuth(`${BASE_URL}/trainings/history/`);
            if (!res.ok) return; // 401/404/5xx – neparsuj
            const data: Training[] = await res.json();
            if (abortedRef.current) return;

            const sorted = [...data].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
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

    // --- filter podľa vybraného mesiaca a sezóny (pre opakované použitie) ---
    const passesFilter = (t: Training) => {
        const d = new Date(t.date);
        const monthOK = selectedMonth === -1 || d.getMonth() === selectedMonth;
        const seasonOK = getSeasonLabel(d) === selectedSeason;
        return monthOK && seasonOK;
    };

    // --- Zoskupenie podľa kategórie (rešpektuje filter) ---
    const trainingsByCategory: Record<string, Training[]> = {};
    for (const category of allCategories) {
        const filtered = trainings.filter(t => t.category_name === category && passesFilter(t));
        if (filtered.length > 0) trainingsByCategory[category] = filtered;
    }

    // --- Prehľad za kategórie + Celkový percent (správny priemer percent) ---
    const statsByCategory = Object.entries(trainingsByCategory).map(([category, items]) => {
        const total = items.length;
        const present = items.filter(t => t.user_status === 'present').length;
        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
        return { category, total, present, percent };
    });

    const categoriesCount = statsByCategory.length;
    const sumPercents = statsByCategory.reduce((acc, s) => acc + s.percent, 0);
    const overallCategoriesPercent = categoriesCount > 0 ? Math.round(sumPercents / categoriesCount) : 0;

    // --- Farba progressu (plynulý prechod) ---
    const getInterpolatedColor = (percent: number): string => {
        const clamp = (n: number) => Math.max(0, Math.min(n, 100));
        const p = clamp(percent);

        if (p <= 25) {
            const ratio = p / 25;
            return interpolateColor([139, 0, 0], [255, 140, 0], ratio);          // darkred -> orange
        } else if (p <= 50) {
            const ratio = (p - 25) / 25;
            return interpolateColor([255, 140, 0], [255, 215, 0], ratio);        // orange -> yellow
        } else if (p <= 75) {
            const ratio = (p - 50) / 25;
            return interpolateColor([255, 215, 0], [173, 255, 47], ratio);       // yellow -> greenyellow
        } else {
            const ratio = (p - 75) / 25;
            return interpolateColor([173, 255, 47], [34, 139, 34], ratio);       // greenyellow -> forestgreen
        }
    };

    const interpolateColor = (start: number[], end: number[], ratio: number): string => {
        const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
        const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
        const b = Math.round(start[2] + (end[2] - start[2]) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: '#f4f4f8' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSeasonPickerVisible(true)} style={styles.filterItem}>
                    <Text style={styles.season}>{selectedSeason}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMonthPickerVisible(true)} style={styles.filterItem}>
                    <Text style={styles.season}>
                        {selectedMonth === -1 ? 'Všetky' : monthNames[monthIndexes.indexOf(selectedMonth)]}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
                {/* ===== CELKOVÁ ÚČASŤ – len ak je viac kategórií ===== */}
                {categoriesCount > 1 && (
                    <View style={{ marginBottom: 0 }}>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${overallCategoriesPercent}%`, backgroundColor: getInterpolatedColor(overallCategoriesPercent) },
                                ]}
                            />
                            <Text style={styles.progressText}>
                                Celkovo ({overallCategoriesPercent}%)
                            </Text>
                        </View>
                    </View>
                )}

                {/* ===== KATEGÓRIE ===== */}
                {Object.entries(trainingsByCategory).map(([category, items]) => {
                    const total = items.length;
                    const present = items.filter(t => t.user_status === 'present').length;
                    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

                    return (
                        <View key={category} style={{ marginBottom: 10 }}>
                            <Text style={styles.categoryTitle}>{category}</Text>

                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${percent}%`, backgroundColor: getInterpolatedColor(percent) },
                                    ]}
                                />
                                <Text style={styles.progressText}>{`Účasť ${present}/${total} (${percent}%)`}</Text>
                            </View>

                            {items.map(t => {
                                const dateObj = new Date(t.date);
                                const formattedDate = dateObj.toLocaleDateString('sk-SK', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                });
                                const formattedTime = dateObj.toLocaleTimeString('sk-SK', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                });
                                const statusColor =
                                    t.user_status === 'present'
                                        ? '#4CAF50'
                                        : t.user_status === 'absent'
                                            ? '#D32F2F'
                                            : '#aaa';

                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={styles.trainingCard}
                                        onPress={() => router.push({ pathname: '/training/[id]', params: { id: String(t.id) } })}
                                    >
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8C1919', marginBottom: 6 }}>
                                            {t.description || 'Tréning'}
                                        </Text>

                                        <Text style={{ color: '#555', marginBottom: 4, fontSize: 17, fontWeight: 'bold' }}>
                                            {formattedTime} • {formattedDate}
                                        </Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 5 }}>
                                            <Text style={{ fontSize: 16, color: '#D32F2F' }}>📍</Text>
                                            <Text style={{ fontSize: 16, color: '#333' }}>{t.location}</Text>
                                        </View>

                                        <View style={styles.statusRow}>
                                            <View
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor:
                                                            t.user_status === 'present'
                                                                ? '#4CAF50' // zelená
                                                                : t.user_status === 'absent'
                                                                    ? '#D32F2F' // červená
                                                                    : '#333',  // čierna
                                                    },
                                                ]}
                                            />
                                            <Text style={styles.statusText}>
                                                {t.user_status === 'present'
                                                    ? 'Zúčastnil si sa'
                                                    : t.user_status === 'absent'
                                                        ? 'Nezúčastnil si sa'
                                                        : 'Nezodpovedal si'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>

            {/* SEASON PICKER MODAL */}
            <Modal visible={seasonPickerVisible} animationType="fade" transparent>
                <Pressable style={styles.modalOverlay} onPress={() => setSeasonPickerVisible(false)}>
                    <Pressable style={styles.pickerModal} onPress={() => {}}>
                        {allSeasons.map(season => (
                            <TouchableOpacity
                                key={season}
                                onPress={() => {
                                    setSelectedSeason(season);
                                    setSeasonPickerVisible(false);
                                }}
                            >
                                <Text style={[styles.drawerText, season === selectedSeason && { fontWeight: 'bold' }]}>{season}</Text>
                            </TouchableOpacity>
                        ))}
                        <Pressable onPress={() => setSeasonPickerVisible(false)} style={{ marginTop: 20 }} />
                    </Pressable>
                </Pressable>
            </Modal>

            {/* MONTH PICKER MODAL */}
            <Modal visible={monthPickerVisible} animationType="fade" transparent>
                <Pressable style={styles.modalOverlay} onPress={() => setMonthPickerVisible(false)}>
                    <Pressable style={styles.SeasonPickerModal} onPress={() => {}}>
                        <ScrollView style={{ maxHeight: 800 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedMonth(-1);
                                    setMonthPickerVisible(false);
                                }}
                            >
                                <Text style={[styles.drawerText, selectedMonth === -1 && { fontWeight: 'bold' }]}>Všetky</Text>
                            </TouchableOpacity>
                            {monthIndexes.map((index, idx) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setSelectedMonth(index);
                                        setMonthPickerVisible(false);
                                    }}
                                >
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
    categoryTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#D32F2F' },
    progressBarContainer: {
        height: 24,
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    progressText: {
        textAlign: 'center',
        color: '#111',
        fontWeight: '600',
    },
    trainingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    trainingTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6, color: '#000' },
    trainingDetail: { fontSize: 15, color: '#555', marginBottom: 4 },
    status: { fontWeight: 'bold', marginTop: 0, fontSize: 12 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    season: {
        fontSize: 15,
        color: '#D32F2F',
        fontWeight: 'bold',
    },
    filterItem: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#f3f3f3',
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
    SeasonPickerModal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: 220,
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 5,
    },
    dot: {
        width: 15,
        height: 15,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
});