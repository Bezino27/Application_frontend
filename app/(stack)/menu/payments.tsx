import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Image,
    Pressable,
} from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { useFetchWithAuth } from "@/hooks/fetchWithAuth";
import { BASE_URL } from "@/hooks/api";

// === Typy pre backend dáta ===
type MemberPayment = {
    id: number;
    amount: string | number;
    variable_symbol: string;
    is_paid: boolean;
    description: string;
    due_date: string;
    created_at: string;
    iban: string;

};

type OrderPayment = {
    id: number;
    order: number;
    jersey_order: number;
    amount: string | number;
    variable_symbol: string;
    is_paid: boolean;
    created_at: string;
    paid_at?: string | null;
    iban: string;
};

type ClubPaymentSettings = {
    iban: string;
    variable_symbol_prefix: string;
    payment_cycle: string;
    due_day: number;
};

export default function PaymentsScreen() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { userClub } = useContext(AuthContext);

    const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
    const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
    const [iban, setIban] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        try {
            const res1 = await fetchWithAuth(`${BASE_URL}/member-payments/`);
            const memberData = res1.ok ? await res1.json() : [];
            setMemberPayments(memberData);

            const res2 = await fetchWithAuth(`${BASE_URL}/orders-payments/`);
            const orderData = res2.ok ? await res2.json() : [];
            setOrderPayments(orderData);
        } catch (err) {
            console.error("❌ Chyba pri fetchnutí platieb:", err);
        }
    };

    const fetchClubPaymentSettings = async () => {
        if (!userClub?.id) return;
        try {
            const res = await fetchWithAuth(`${BASE_URL}/club-payments-settings/${userClub.id}/`);

if (!res.ok) {
  console.error("❌ Klub payment settings error:", res.status, await res.text());
  return;
}

const data: ClubPaymentSettings = await res.json();
setIban(data.iban);
        } catch (e) {
            console.error("❌ Nepodarilo sa načítať IBAN:", e);
        }
    };

    useEffect(() => {
        Promise.all([fetchPayments(), fetchClubPaymentSettings()]).finally(() =>
            setLoading(false)
        );
    }, []);

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    // Komponent pre jednu kartu
    const PaymentCard = ({
        id,
        type,
        label,
        amount,
        variable_symbol,
        is_paid,
        description,
        due_date,
        created_at,
        iban,
    }: {
        id: string;
        type: "member" | "order";
        label: string;
        amount: number;
        variable_symbol: string;
        is_paid: boolean;
        description?: string;
        due_date?: string;
        created_at?: string;
        iban?: string; 
    }) => {
        const isExpanded = expandedId === id;

        return (
            <View key={id} style={styles.card}>
                <Pressable
                    onPress={() => setExpandedId(isExpanded ? null : id)}
                >
                    <Text style={styles.description}>
                        {description || label}
                    </Text>
                    <Text style={styles.amount}>{amount.toFixed(2)} €</Text>
                    {due_date && (
                        <Text>
                            Splatnosť:{" "}
                            {new Date(due_date).toLocaleDateString("sk-SK")}
                        </Text>
                    )}
                    {created_at && (
                        <Text>
                            Vytvorené:{" "}
                            {new Date(created_at).toLocaleDateString("sk-SK")}
                        </Text>
                    )}
                    <Text
                        style={{
                            fontWeight: "600",
                            color: is_paid ? "#4CAF50" : "#D32F2F",
                            marginTop: 4,
                        }}
                    >
                        {is_paid ? "✅ Uhradené" : "❌ Neuhradené"}
                    </Text>
                </Pressable>

                    {isExpanded && (
                    <View style={{ marginTop: 10 }}>
                        <Text selectable style={styles.copyable}>
                        VS: {variable_symbol}
                        </Text>

                        {/* 🔥 IBAN aj pre členské, aj pre objednávky */}
                        {iban && (
                        <Text selectable style={styles.copyable}>
                            IBAN: {iban}
                        </Text>
                        )}

                        <Image
                        source={{
                            uri: `${BASE_URL}/payment-qr/${type}/${id.split("-")[1]}/`,
                        }}
                        style={styles.qr}
                        />
                        <Text style={styles.qrLabel}>QR pre platbu</Text>
                    </View>
                    )}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* === Členské platby === */}
            <Text style={styles.sectionTitle}>Členské platby</Text>
            {memberPayments.length === 0 && (
                <Text>Žiadne členské platby</Text>
            )}
            {memberPayments.map((p) => (
                <PaymentCard
                    key={`member-${p.id}`}
                    id={`member-${p.id}`}
                    type="member"
                    label="Členský príspevok"
                    amount={Number(p.amount)}
                    variable_symbol={p.variable_symbol}
                    is_paid={p.is_paid}
                    description={p.description}
                    due_date={p.due_date}
                    created_at={p.created_at}
                    iban={p.iban} 

                />
            ))}

            {/* === Objednávkové platby === */}
            <Text style={styles.sectionTitle}>Platby za objednávky</Text>
            {orderPayments.length === 0 ? (
                <Text>Žiadne objednávkové platby</Text>
            ) : (
                orderPayments.map((p) => (
                <PaymentCard
                    key={`order-${p.id}`}
                    id={`order-${p.id}`}
                    type="order"
                    label={
                    p.order
                        ? `Objednávka #${p.order}`
                        : p.jersey_order
                        ? `Dresová objednávka #${p.jersey_order}`
                        : "Objednávka"
                    }
                    amount={Number(p.amount)}
                    variable_symbol={p.variable_symbol}
                    is_paid={p.is_paid}
                    created_at={p.created_at}
                    iban={p.iban}
                />
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        marginTop: 15,
        color: "#111",
    },
    card: {
        backgroundColor: "#fff",
        padding: 15,
        marginBottom: 20,
        borderRadius: 10,
        elevation: 2,
    },
    amount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#D32F2F",
        marginBottom: 6,
    },
    qr: {
        marginTop: 10,
        width: 180,
        height: 180,
        alignSelf: "center",
    },
    qrLabel: {
        textAlign: "center",
        fontSize: 12,
        color: "#555",
        marginTop: 4,
    },
    copyable: {
        fontWeight: "500",
        color: "#333",
        marginTop: 4,
    },
    description: {
        fontSize: 14,
        fontStyle: "italic",
        color: "#444",
        marginTop: 8,
        marginBottom: 8,
    },
});
