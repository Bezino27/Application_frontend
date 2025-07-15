import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../hooks/api';
import { useRouter } from "expo-router";

type Training = {
  id: number;
  title: string;
  date: string;
  category: string;
};

export default function TreningyScreen() {
  const { isLoggedIn, accessToken, userCategories } = useContext(AuthContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("Používateľove kategórie:", userCategories);
  console.log("Stiahnuté tréningy:", trainings);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, mounted]);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        if (!accessToken) return;

        const res = await fetch(`${BASE_URL}/player-trainings/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          console.error("Chyba pri načítaní tréningov - status:", res.status);
          return;
        }

        const data = await res.json();
        setTrainings(data);
      } catch (error) {
        console.error("Chyba pri načítaní tréningov:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted && isLoggedIn && accessToken) {
      fetchTrainings();
    }
  }, [mounted, isLoggedIn, accessToken]);

  if (!isLoggedIn || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{loading ? "Načítavam tréningy..." : "Overujem prihlásenie..."}</Text>
      </View>
    );
  }

  // Zoskupenie tréningov podľa kategórie
  const groupedTrainings = userCategories.reduce((acc, category) => {
    const filtered = trainings
      .filter(t => t.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Training[]>);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>Tvoje tréningy</Text>
      
      {Object.keys(groupedTrainings).length === 0 ? (
        <Text style={{ fontStyle: 'italic' }}>Žiadne tréningy nenájdené</Text>
      ) : (
        Object.entries(groupedTrainings).map(([category, trainings]) => (
          <View key={category} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{category}</Text>
            {trainings.map(t => (
              <View key={t.id} style={{ paddingVertical: 5 }}>
                <Text style={{ fontSize: 16 }}>{t.title}</Text>
                <Text style={{ color: 'gray' }}>{new Date(t.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}