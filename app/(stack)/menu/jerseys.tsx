import React, { useEffect, useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Image,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";
import { AuthContext } from "@/context/AuthContext";

type Category = {
    id: number;
    name: string;
};

type JerseyData = {
    category: string;
    used_numbers: number[];
};

export default function NumbersScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userClub } = useContext(AuthContext);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [data, setData] = useState<JerseyData[]>([]);
    const [allNumbers, setAllNumbers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/categories-in-club/`);
            const json = await res.json();
            setCategories(json);
        } catch (err) {
            console.error("Chyba pri načítaní kategórií:", err);
        }
    };

    const fetchNumbers = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/jersey-numbers/`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Chyba pri načítaní čísel:", err);
        }
    };

    const fetchAllNumbers = async () => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/jersey-numbers/?all=true`);
            const json = await res.json();
            setAllNumbers(json.all || []);
        } catch (err) {
            console.error("Chyba pri načítaní všetkých čísel:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchNumbers();
        fetchAllNumbers();
    }, []);

    const calculateDuplicatesInCategory = (numbers: number[]): number[] => {
        const counts: Record<number, number> = {};
        numbers.forEach((n) => {
            counts[n] = (counts[n] || 0) + 1;
        });
        return Object.keys(counts).filter((n) => counts[+n] > 1).map(Number);
    };

    const calculateGlobalDuplicates = (numbers: number[]): number[] => {
        const counts: Record<number, number> = {};
        numbers.forEach((n) => {
            counts[n] = (counts[n] || 0) + 1;
        });
        return Object.keys(counts).filter((n) => counts[+n] > 1).map(Number);
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterTag, selectedCategory === null && styles.filterTagActive]}
                    onPress={() => setSelectedCategory(null)}
                >
                    <Text style={[styles.filterText, selectedCategory === null && styles.filterTextActive]}>Všetky</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.filterTag, selectedCategory === cat.name && styles.filterTagActive]}
                        onPress={() => setSelectedCategory(cat.name)}
                    >
                        <Text style={[styles.filterText, selectedCategory === cat.name && styles.filterTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {selectedCategory === null ? (
                <View style={styles.categoryCard}>
                    <View style={styles.grid}>
                        {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
                            const isUsed = allNumbers.includes(num);
                            const duplicates = calculateGlobalDuplicates(allNumbers);
                            const isDuplicate = duplicates.includes(num);
                            return (
                                <View key={num} style={styles.dresWrapper}>
                                    <Image
                                        source={require("@/assets/images/dres_final.png")}
                                        style={[styles.dresImage, !isUsed && { opacity: 0.15 }]}
                                    />
                                    <Text style={[styles.dresNumber, isDuplicate && isUsed && { color: "yellow" }]}>{num}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            ) : (
                data.filter((d) => d.category === selectedCategory).map((item) => {
                    const duplicates = calculateDuplicatesInCategory(item.used_numbers);
                    return (
                        <View key={item.category} style={styles.categoryCard}>
                            <Text style={styles.categoryTitle}>{item.category}</Text>
                            <View style={styles.grid}>
                                {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
                                    const isUsed = item.used_numbers.includes(num);
                                    const isDuplicate = duplicates.includes(num);
                                    return (
                                        <View key={num} style={styles.dresWrapper}>
                                            <Image
                                                source={require("@/assets/images/dres_final.png")}
                                                style={[styles.dresImage, !isUsed && { opacity: 0.15 }]}
                                            />
                                            <Text style={[styles.dresNumber, isDuplicate && isUsed && { color: "yellow" }]}>{num}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { backgroundColor: "#f0f0f0", paddingVertical: 20 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: "#111" },
    filterRow: { paddingHorizontal: 16, marginBottom: 15, flexDirection: "row", gap: 8 },
    filterTag: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        elevation: 1,
    },
    filterTagActive: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
    filterText: { fontWeight: "600", color: "#333" },
    filterTextActive: { color: "#fff" },
    categoryCard: {
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#fff",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    categoryTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: "#D32F2F", textAlign: "center" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
    dresWrapper: { width: 44, height: 56, alignItems: "center", justifyContent: "center", position: "relative" },
    dresImage: { width: 44, height: 56, resizeMode: "contain", position: "absolute" },
    dresNumber: { fontWeight: "bold", color: "#111", fontSize: 13, zIndex: 1 },
});
