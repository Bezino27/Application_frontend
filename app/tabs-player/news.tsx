import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { BASE_URL } from '@/hooks/api';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';

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
  user_status: "present" | "absent" | "unknown";
};

export default function TreningyScreen() {
  const { isLoggedIn, userCategories } = useContext(AuthContext);
  const { fetchWithAuth } = useFetchWithAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);



  const fetchTrainings = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/player-trainings/`);
      const data = await res.json();
      const now = new Date();
      const upcomingTrainings = data.filter((t: Training) => new Date(t.date) > now);
      setTrainings(upcomingTrainings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]); // alebo [] ak fetchWithAuth sa nemení nikdy


  useEffect(() => {
    if (isLoggedIn) {
      fetchTrainings().then((result) => {
      });
    }
  }, [isLoggedIn, fetchTrainings]);

  const handleAttendanceChange = async (
      trainingId: number,
      newStatus: "present" | "absent" | "unknown"
  ) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/set-training-attendance/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ training_id: trainingId, status: newStatus }),
      });

      if (!res.ok) {
        Alert.alert("Chyba", "Nepodarilo sa zmeniť status účasti.");
        return;
      }

      // 🧠 Lokálna aktualizácia
      setTrainings((prev) =>
          prev.map((t) =>
              t.id === trainingId
                  ? {
                    ...t,
                    user_status: newStatus,
                    attendance_summary: {
                      ...t.attendance_summary,
                      // len orientačne – reálne hodnoty sa nezmenia bez reloadu
                      present: newStatus === "present"
                          ? t.attendance_summary.present + 1
                          : newStatus === "absent" && t.user_status === "present"
                              ? t.attendance_summary.present - 1
                              : t.attendance_summary.present,
                      absent: newStatus === "absent"
                          ? t.attendance_summary.absent + 1
                          : newStatus === "present" && t.user_status === "absent"
                              ? t.attendance_summary.absent - 1
                              : t.attendance_summary.absent,
                      unknown: t.attendance_summary.unknown, // nemeníme
                    },
                  }
                  : t
          )
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa zmeniť status účasti.");
    }
  };

  if (!isLoggedIn || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  const groupedTrainings = userCategories.reduce((acc, category) => {
    const filtered = trainings.filter(t => t.category_name === category);
    if (filtered.length > 0) acc[category] = filtered;
    return acc;
  }, {} as Record<string, Training[]>);

  return (
    <ScrollView style={{ padding: 20 }}>
      {Object.entries(groupedTrainings).map(([category, trainings]) => (
        <View key={category} style={{ marginBottom: 30 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 15 }}>{category}</Text>

          {trainings.map(t => {
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
            const now = new Date();
            const trainingDate = new Date(t.date);
            const canChangeStatus = trainingDate.getTime() - now.getTime() > 3 * 60 * 60 * 1000;

            return (
              <View
                key={t.id}
                style={{
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
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>
                  {t.description || "Tréning"}
                </Text>
                <Text style={{ color: 'gray', marginBottom: 8 }}>
                  {formattedDate}, {formattedTime}
                </Text>

                <Text>✅ Príde: {t.attendance_summary.present}</Text>
                <Text>❌ Nepríde: {t.attendance_summary.absent}</Text>
                <Text>❓ Nehlasovalo: {t.attendance_summary.unknown}</Text>

                <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                {canChangeStatus ? (
                <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                    {["present", "absent", "unknown"].map(status => {
                    const label = status === "present"
                        ? "Prídem"
                        : status === "absent"
                        ? "Neprídem"
                        : "Nezodpovedané";

                    const backgroundColor = t.user_status === status
                        ? status === "present"
                        ? "#4caf50"
                        : status === "absent"
                        ? "#f44336"
                        : "#9e9e9e"
                        : "#e0e0e0";

                    const textColor = t.user_status === status ? "#fff" : "#000";

                    return (
                        <TouchableOpacity
                        key={status}
                        onPress={() => handleAttendanceChange(t.id, status as any)}
                        style={{
                            backgroundColor,
                            paddingVertical: 6,
                            paddingHorizontal: 14,
                            borderRadius: 20,
                        }}
                        >
                        <Text style={{ color: textColor, fontWeight: "600" }}>{label}</Text>
                        </TouchableOpacity>
                    );
                    })}
                </View>
                ) : (
                <Text style={{ marginTop: 10, color: 'gray', fontStyle: 'italic' }}>
                    Zmena účasti už nie je možná (menej ako 3 hodiny pred tréningom)
                </Text>
                )}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}