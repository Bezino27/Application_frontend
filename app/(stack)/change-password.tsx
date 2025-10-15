import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '@/hooks/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Chyba', 'Vyplň všetky polia.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Chyba', 'Nové heslá sa nezhodujú.');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('access');
            const response = await fetch(`${BASE_URL}/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Chyba', data.detail || 'Nepodarilo sa zmeniť heslo.');
                return;
            }

            Alert.alert('✅ Úspech', data.detail || 'Heslo bolo zmenené.');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Chyba', 'Skús to znova neskôr.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>

            <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Staré heslo"
                placeholderTextColor="#999"
                value={oldPassword}
                onChangeText={setOldPassword}
            />
            <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Nové heslo"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
            />
            <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Zopakuj nové heslo"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.toggleButton}
            >
                <Text style={{ color: '#D32F2F', fontWeight: '600' }}>
                    {showPassword ? 'Skryť heslá' : 'Zobraziť heslá'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleChangePassword}
                style={styles.submitButton}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>Zmeniť heslo</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backText: { marginLeft: 6, color: '#D32F2F', fontSize: 16 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111' },
    input: {
        backgroundColor: '#f2f2f2',
        padding: 12,
        borderRadius: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 12,
        color: '#000',
    },
    toggleButton: {
        marginBottom: 20,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});