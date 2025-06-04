import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../hooks/api';

// Typ pre Club - uprav podľa svojho backendu
interface Club {
  id: number;
  name: string;
  description?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/select-role');
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Požiadavka na získanie tokenu
      const response = await fetch(`${BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Neplatné prihlasovacie údaje');
      }

      const data = await response.json();

      // 2. Požiadavka na získanie údajov používateľa (vrátane rolí a klubu)
      const meResponse = await fetch(`${BASE_URL}/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      if (!meResponse.ok) {
        throw new Error('Nepodarilo sa načítať údaje o používateľovi');
      }

      const meData = await meResponse.json();

      // 3. Typovanie a bezpečné načítanie klubu
      const club: Club | null = meData.club ?? null;
      const roles: string[] = Array.isArray(meData.roles) ? meData.roles : [];

      // 4. Zavolanie login z AuthContext
      await login(data.access, data.refresh, club, roles);

      // 5. Presmerovanie po úspešnom prihlásení
      router.replace('/select-role');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri:
          'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1280&q=80',
      }}
      style={styles.background}
      blurRadius={2}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Vitaj späť 👋</Text>
        <Text style={styles.subtitle}>Prihlás sa do systému</Text>

        <TextInput
          placeholder="Používateľské meno"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TextInput
          placeholder="Heslo"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
          style={styles.input}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            <Text style={styles.buttonText}>Prihlásiť sa</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#ddd', marginBottom: 30 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4c68d7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  error: { color: '#ff4d4d', marginBottom: 10, fontSize: 15 },
});