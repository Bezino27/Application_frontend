import React, { useEffect, useState, useContext, useCallback } from 'react';
import {View, Alert, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { BASE_URL } from '@/hooks/api';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { useRouter } from 'expo-router';

type Training = {
    id: number;
    description: string;
    date: string;
    category: number;
    category_name: string;
    attendance_summary: {
        present: number;
        absent: number;
        unknown: number;
    };
};

export default function TreningyCoachScreen() {
    const { isLoggedIn, userRoles, accessToken } = useContext(AuthContext);
    const { fetchWithAuth } = useFetchWithAuth();
    const router = useRouter();

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);

    const coachCategories = userRoles
        .filter(r => r.role.toLowerCase() === 'coach' || r.role.toLowerCase() === 'tréner')
        .map(r => r.category.name);

    const fetchTrainings = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/player-trainings/`);
            const data = await res.json();
            const now = new Date();
            const upcomingTrainings = data.filter((t: Training) => new Date(t.date) > now);
            setTrainings(upcomingTrainings);
        } catch (error) {
            console.error("fetchTrainings error:", error);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth]);

    useEffect(() => {
        if (isLoggedIn && accessToken) {
            fetchTrainings();
        }
    }, [isLoggedIn]);

    const groupedTrainings = coachCategories
        .filter((v, i, a) => a.indexOf(v) === i)
        .reduce((acc, category) => {
            const filtered = trainings.filter((t) => t.category_name === category);
            if (filtered.length > 0) acc[category] = filtered;
            return acc;
        }, {} as Record<string, Training[]>);

    if (!isLoggedIn || loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={{ padding: 20 }}>
            {Object.entries(groupedTrainings).map(([category, trainings]) => (
                <View key={category} style={{ marginBottom: 30 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 15 }}>{category}</Text>
                    {trainings.map((t) => {
                        const dateObj = new Date(t.date);
                        const formattedDate = dateObj.toLocaleDateString("sk-SK", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                        const formattedTime = dateObj.toLocaleTimeString("sk-SK", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        });

                        return (
                            <TouchableOpacity
                                key={t.id}
                                onPress={async () => {
                                    try {
                                        const res = await fetchWithAuth(`${BASE_URL}/training-detail/${t.id}/`);
                                        const data = await res.json();

                                        // Ak potrebuješ dáta posunúť do detailu cez params, urob to tu
                                        router.push({ pathname: "../(stack)/training/[id]", params: { id: String(t.id) } });
                                    } catch (error) {
                                        console.error("Chyba pri načítaní tréningu:", error);
                                        Alert.alert("Chyba", "Nepodarilo sa načítať tréning.");
                                    }
                                }}                                style={{
                                    marginBottom: 15,
                                    padding: 15,
                                    backgroundColor: '#fff',
                                    borderRadius: 10,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 5,
                                    elevation: 3,
                                }}
                            >
                                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5, color: '#007AFF' }}>
                                    {t.description || "Tréning"}
                                </Text>
                                <Text style={{ color: 'gray', marginBottom: 8 }}>
                                    {formattedTime} - {formattedDate}
                                </Text>
                                <Text style={styles.attendance}>✅ Príde: {t.attendance_summary.present}</Text>
                                <Text style={styles.attendance}>❌ Nepríde: {t.attendance_summary.absent}</Text>
                                <Text style={styles.attendance}>❓ Nehlasovalo: {t.attendance_summary.unknown}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    attendance: {
        fontSize: 15,
        lineHeight: 20,       // väčší vertikálny odstup medzi riadkami textu
        marginBottom: 6,      // medzera medzi jednotlivými Text komponentami
    }
});