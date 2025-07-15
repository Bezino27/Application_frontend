import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Button, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../hooks/api';

type Training = {
  id: number;
  description: string;
  date: string;
  category: number; // ID kategórie
  category_name: string; // názov kategórie
  attendance_summary: {
    present: number;
    absent: number;
    unknown: number;
  };
  user_status: "present" | "absent" | "unknown";
};

export default function TreningyScreen() {
  const { isLoggedIn, accessToken, userCategories } = useContext(AuthContext);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const fetchTrainings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/player-trainings/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Chyba pri načítaní tréningov');
      const data = await res.json();
      setTrainings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchTrainings();
  }, [isLoggedIn]);

  const handleAttendanceChange = async (trainingId: number, newStatus: "present" | "absent" | "unknown") => {
    try {
      const res = await fetch(`${BASE_URL}/set-training-attendance/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ training_id: trainingId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Nepodarilo sa aktualizovať účasť");
      await fetchTrainings();
    } catch (error) {
      Alert.alert("Chyba");
    }
  };

  if (!isLoggedIn || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  // Zoskupenie podľa kategórie
const groupedTrainings = userCategories.reduce((acc, category) => {
  const filtered = trainings.filter(t => t.category_name === category);
  if (filtered.length > 0) acc[category] = filtered;
  return acc;
}, {} as Record<string, Training[]>);

  return (
    <ScrollView style={{ padding: 20 }}>
      {Object.entries(groupedTrainings).map(([category, trainings]) => (
        <View key={category} style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>{category}</Text>
          {trainings.map(t => (
            <View key={t.id} style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16 }}>{t.description || "Tréning"}</Text>
              <Text style={{ color: 'gray' }}>{new Date(t.date).toLocaleDateString()}</Text>
              <Text>Prišlo: {t.attendance_summary.present}</Text>
              <Text>Neprišlo: {t.attendance_summary.absent}</Text>
              <Text>Nezodpovedané: {t.attendance_summary.unknown}</Text>
              
              <View style={{ flexDirection: 'row', marginTop: 5 }}>
                {["present", "absent", "unknown"].map(status => (
                  <Button
                    key={status}
                    title={status === "present" ? "Pôjdem" : status === "absent" ? "Nepôjdem" : "Nezodpovedané"}
                    onPress={() => handleAttendanceChange(t.id, status as any)}
                    color={t.user_status === status ? "green" : "gray"}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}