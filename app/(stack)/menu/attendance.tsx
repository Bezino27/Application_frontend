import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

type PlayerCategory = {
  category_id: number;
  category_name: string;
  attendance_percentage: number;
  last_training_date?: string | null;
};

type PlayerSummary = {
  player_id: number;
  name: string;
  number?: string | null;
  position?: string | null;
  overall_attendance: number;
  categories: PlayerCategory[];
};

export default function AttendanceScreen() {
  const { fetchWithAuth } = useFetchWithAuth();
  const { isLoggedIn, accessToken } = useContext(AuthContext);
  const [data, setData] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 filtre
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const months = [
    { id: 1, name: "Január" },
    { id: 2, name: "Február" },
    { id: 3, name: "Marec" },
    { id: 4, name: "Apríl" },
    { id: 5, name: "Máj" },
    { id: 6, name: "Jún" },
    { id: 7, name: "Júl" },
    { id: 8, name: "August" },
    { id: 9, name: "September" },
    { id: 10, name: "Október" },
    { id: 11, name: "November" },
    { id: 12, name: "December" },
  ];

  // 🔹 Načítanie dát s filtrami
  const fetchData = async () => {
    if (!isLoggedIn || !accessToken) return;
    setLoading(true);
    try {
      let url = `${BASE_URL}/coach-attendance-summary/`;
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedMonth) params.append("month", String(selectedMonth));
      if (selectedSeason) params.append("season", selectedSeason);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Nepodarilo sa načítať dochádzku.");
      const json: PlayerSummary[] = await res.json();
      setData(json);

      // 🔸 automaticky zisti sezóny
      const years = Array.from(
        new Set(
          json
            .flatMap((p) =>
              p.categories
                .map((c) =>
                  c.last_training_date
                    ? new Date(c.last_training_date).getFullYear()
                    : null
                )
                .filter((y): y is number => y !== null && !isNaN(y))
            )
        )
      ).sort((a, b) => b - a);

      const generatedSeasons = years.map((y) => `${y}/${y + 1}`);
      setAvailableSeasons(generatedSeasons);
    } catch (e) {
      console.error("❌ Attendance load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isLoggedIn, accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedCategory, selectedMonth, selectedSeason])
  );

  const allCategories = Array.from(
    new Set(
      data.flatMap((p) => p.categories.map((c: PlayerCategory) => c.category_name))
    )
  );

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // 🔍 Filtrovanie podľa vyhľadávania
  const filtered = data.filter((player) => {
    const q = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(q) ||
      String(player.number || "").includes(q)
    );
  });

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      ref={scrollRef}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 🔻 Filtre */}
      <View style={styles.filterSection}>
        {/* Sezóny */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {availableSeasons.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSelectedSeason(selectedSeason === s ? null : s)}
              style={[
                styles.filterItem,
                selectedSeason === s && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedSeason === s && styles.activeFilterText,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mesiace */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 6 }}
        >
          {months.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() =>
                setSelectedMonth(selectedMonth === m.id ? null : m.id)
              }
              style={[
                styles.filterItem,
                selectedMonth === m.id && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedMonth === m.id && styles.activeFilterText,
                ]}
              >
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Kategórie */}
        <ScrollView
          horizontal
          style={{ marginTop: 6 }}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => handleCategoryChange(null)}
            style={[
              styles.filterItem,
              selectedCategory === null && styles.activeFilter,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === null && styles.activeFilterText,
              ]}
            >
              Všetky
            </Text>
          </TouchableOpacity>
          {allCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategoryChange(cat)}
              style={[
                styles.filterItem,
                selectedCategory === cat && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat && styles.activeFilterText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🔍 Vyhľadávanie */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Hľadaj hráča podľa mena alebo čísla..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 🧍‍♂️ Zoznam hráčov */}
      <View style={{ paddingHorizontal: 20 }}>
        {filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#666" }}>
            Žiadni hráči nevyhovujú filtrom
          </Text>
        ) : (
          filtered.map((player) => {
            const attendancePercent = selectedCategory
              ? player.categories.find(
                  (c) => c.category_name === selectedCategory
                )?.attendance_percentage || 0
              : player.overall_attendance;

            const barColor =
              attendancePercent >= 80
                ? "#2e7d32"
                : attendancePercent >= 50
                ? "#f9a825"
                : "#d32f2f";

            return (
              <TouchableOpacity
                key={player.player_id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/player/[id]",
                    params: { id: String(player.player_id) },
                  })
                }
              >
                <Text style={styles.name}>
                  {player.name} #{player.number}
                </Text>
                <Text style={styles.sub}>
                  {player.position || "Bez pozície"}
                </Text>
                <View style={styles.progressBarWrap}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${attendancePercent}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
                <Text style={styles.percentText}>
                  {attendancePercent.toFixed(1)}%
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterSection: {
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterItem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: { backgroundColor: "#D32F2F" },
  filterText: { color: "#000", fontWeight: "bold" },
  activeFilterText: { color: "#fff" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: "#000" },
  sub: { fontSize: 14, color: "#666", marginBottom: 8 },
  progressBarWrap: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  percentText: { marginTop: 5, fontSize: 13, color: "#444" },
});
