import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    ActivityIndicator,
    Image,
} from "react-native";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";

type Document = {
    id: number;
    title: string;
    file: string;
    uploaded_at: string;
};

export default function DocumentsScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetchWithAuth(`${BASE_URL}/documents/`);
                const json = await res.json();
                setDocuments(json);
            } catch (err) {
                console.error("Chyba pri načítaní dokumentov:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {documents.map((doc) => (
                <View key={doc.id} style={styles.card}>
                    <View style={styles.iconTitle}>
                        <Image
                            source={require("@/assets/images/dokument.png")} // ← ikona PDF
                            style={styles.icon}
                        />
                        <View>
                            <Text style={styles.docTitle}>{doc.title}</Text>
                            <Text style={styles.date}>{doc.uploaded_at}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => Linking.openURL(doc.file)}
                    >
                        <Text style={styles.downloadText}>Stiahnuť</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f2f2f2",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#D32F2F",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    icon: {
        width: 40,
        height: 40,
        resizeMode: "contain",
    },
    docTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    date: {
        fontSize: 13,
        color: "#888",
    },
    downloadButton: {
        backgroundColor: "#D32F2F",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    downloadText: {
        color: "#fff",
        fontWeight: "600",
    },
});