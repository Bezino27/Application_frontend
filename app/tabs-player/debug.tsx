import React, { useContext } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/context/AuthContext';

export default function DebugScreen() {
  const { accessToken, refreshAccessToken } = useContext(AuthContext);

  const invalidateAccessToken = async () => {
    await AsyncStorage.setItem('access', 'NEPLATNY_TOKEN');
    console.log('Access token bol nastavený na NEPLATNY_TOKEN');
  };

  const clearAccessToken = async () => {
    await AsyncStorage.removeItem('access');
    console.log('Access token bol odstránený');
  };

  const testProtectedRequest = async () => {
    const token = await refreshAccessToken();
    console.log('Výsledok testovacieho fetchu. Access token:', token);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Debug Tools</Text>
      <Text>Aktuálny Access Token:</Text>
      <Text style={{ fontFamily: 'monospace', marginVertical: 8 }}>{accessToken}</Text>

      <Button title="❌ Nastav neplatný access token" onPress={invalidateAccessToken} />
      <View style={{ height: 10 }} />
      <Button title="🧹 Vymaž access token" onPress={clearAccessToken} />
      <View style={{ height: 10 }} />
      <Button title="🔄 Otestuj fetchWithAuth" onPress={testProtectedRequest} />
    </ScrollView>
  );
}