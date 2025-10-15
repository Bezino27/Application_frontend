import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { useFocusEffect } from "@react-navigation/native";

type Announcement = {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_by_name: string;   // celé meno
  club: number;
  category: number | null;
  date_created: string;
  read_at: string | null;
};

export default function AnnouncementsScreen() {
  const { fetchWithAuth } = useFetchWithAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/announcements/`);
      if (!res.ok) throw new Error("Nepodarilo sa načítať oznamy");
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error("❌ Chyba pri načítaní oznamov:", err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await fetchWithAuth(`${BASE_URL}/announcements/${id}/read/`, {
        method: "POST",
      });
      // hneď update local state
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, read_at: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("❌ Chyba pri označení oznamu ako prečítaného:", err);
    }
  };

  // refresh pri prvom mountnutí
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // refresh pri návrate na screen
  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
    }, [])
  );

const renderItem = ({ item }: { item: Announcement }) => {
  const isRead = !!item.read_at;

  return (
    <TouchableOpacity
      style={[styles.card, !isRead && styles.unreadCard]}
      onPress={() => {
        setSelected(item);
        if (!isRead) markRead(item.id);
      }}
    >
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {item.title}
      </Text>
      <Text style={styles.meta}>
        {item.created_by_name} •{" "}
        {new Date(item.date_created).toLocaleString("sk-SK")}
      </Text>

      {isRead ? (
        <Text style={styles.preview} numberOfLines={2} ellipsizeMode="tail">
          {item.content}
        </Text>
      ) : (
        <Text style={styles.unreadPreview}>📩 Neotvorený oznam</Text>
      )}

      {item.read_at && (
        <Text style={styles.readMeta}>
          Prečítané: {new Date(item.read_at).toLocaleString("sk-SK")}
        </Text>
      )}
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  // DETAIL VIEW
  if (selected) {
    return (
      <ScrollView contentContainerStyle={styles.detailContainer}>
        <Text style={styles.detailTitle}>{selected.title}</Text>
        <Text style={styles.detailMeta}>
          {selected.created_by_name} •{" "}
          {new Date(selected.date_created).toLocaleString("sk-SK")}
        </Text>
        {selected.read_at && (
          <Text style={styles.detailRead}>
            Prečítané: {new Date(selected.read_at).toLocaleString("sk-SK")}
          </Text>
        )}
        <Text style={styles.detailContent}>{selected.content}</Text>

        <TouchableOpacity
          onPress={() => setSelected(null)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>⬅️ Späť na zoznam</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // LIST VIEW
  return (
    <FlatList
      data={announcements}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16 }}
      refreshing={loading}
      onRefresh={fetchAnnouncements}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
    backgroundColor: "#fff8f8",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111",
  },
  meta: {
    fontSize: 13,
    color: "#777",
    marginBottom: 4,
  },
  readMeta: {
    fontSize: 12,
    color: "#388e3c",
    marginBottom: 6,
    fontStyle: "italic",
  },
  preview: { fontSize: 15, color: "#333" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  detailContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111",
  },
  detailMeta: { fontSize: 14, color: "#777", marginBottom: 6 },
  detailRead: {
    fontSize: 13,
    color: "#388e3c",
    marginBottom: 12,
    fontStyle: "italic",
  },
  detailContent: { fontSize: 16, lineHeight: 22, color: "#333" },

  backButton: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  unreadPreview: {
  fontSize: 14,
  color: "#D32F2F",
  fontStyle: "italic",
  marginTop: 6,
},

});
