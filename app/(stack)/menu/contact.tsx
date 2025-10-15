import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { BASE_URL } from '@/hooks/api';

type ClubInfo = {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    contact_person?: string;
    iban?: string;
};

export default function ContactScreen() {
    const { userClub } = useContext(AuthContext);
    const { fetchWithAuth } = useFetchWithAuth();
    const [club, setClub] = useState<ClubInfo | null>(null);

    useEffect(() => {
        const fetchClub = async () => {
            if (!userClub) return;
            const res = await fetchWithAuth(`${BASE_URL}/clubs/${userClub.id}/`);
            if (res.ok) {
                const data = await res.json();
                setClub(data);
            }
        };
        fetchClub();
    }, [userClub]);

    const openMap = (address: string) => {
        const encoded = encodeURIComponent(address);
        const url =
            Platform.OS === 'ios'
                ? `http://maps.apple.com/?daddr=${encoded}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
        Linking.openURL(url);
    };

    if (!club) return <Text style={styles.loading}>Načítavam údaje o klube...</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{club.name}</Text>

            <View style={styles.card}>
                {club.description && (
                    <>
                        <Text style={styles.text}>{club.description}</Text>
                    </>
                )}

                {club.address && (
                    <>
                        <Text style={styles.label}>📍 Adresa</Text>
                        <TouchableOpacity onPress={() => openMap(club.address!)}>
                            <Text style={styles.link}>{club.address}</Text>
                        </TouchableOpacity>
                    </>
                )}

                {club.phone && (
                    <>
                        <Text style={styles.label}>📞 Telefón</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${club.phone}`)}>
                            <Text style={styles.link}>{club.phone}</Text>
                        </TouchableOpacity>
                    </>
                )}

                {club.email && (
                    <>
                        <Text style={styles.label}>✉️ Email</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${club.email}`)}>
                            <Text style={styles.link}>{club.email}</Text>
                        </TouchableOpacity>
                    </>
                )}

                {club.contact_person && (
                    <>
                        <Text style={styles.label}>👤 Kontaktná osoba</Text>
                        <Text style={styles.text}>{club.contact_person}</Text>
                    </>
                )}

                {club.iban && (
                    <>
                        <Text style={styles.label}>🏦 IBAN</Text>
                        <View style={styles.ibanBox}>
                            <Text selectable style={styles.ibanText}>{club.iban}</Text>
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f4f4f8',
        flexGrow: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#D32F2F',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        color: '#555',
    },
    text: {
        fontSize: 16,
        color: '#111',
        marginTop: 4,
        lineHeight: 22,
        textAlign: 'justify',
    },
    link: {
        fontSize: 16,
        color: '#D32F2F',
        marginTop: 4,
        fontWeight: '600',
    },
    ibanBox: {
        backgroundColor: '#f1f1f1',
        padding: 12,
        borderRadius: 8,
        marginTop: 6,
    },
    ibanText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    loading: {
        marginTop: 50,
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
    },
});