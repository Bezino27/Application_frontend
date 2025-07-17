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
  Image,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../hooks/api';

// Typ pre Club - uprav podľa svojho backendu
interface Club {
  id: number;
  name: string;
  description?: string;
}

interface UserDetails {
  username: string;
  name: string;
  birth_date: string;
  number: string;
  email: string;
  email_2?: string;
  height?: string;
  weight?: string;
  side?: string;
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
      const details: UserDetails = {
        username: meData.username,
        name: meData.name,
        birth_date: meData.birth_date,
        number: meData.number,
        email: meData.email,
        email_2: meData.email_2,
        height: meData.height,
        weight: meData.weight,
        side: meData.side,
      };
      // 3. Typovanie a bezpečné načítanie klubu

      const club: Club | null = meData.club ?? null;
      const roles: string[] = Array.isArray(meData.roles) ? meData.roles : [];
      const categories: string[] = Array.isArray(meData.assigned_categories) ? meData.assigned_categories : [];
      console.log('meData:', meData);
      // 4. Zavolanie login z AuthContext
      // Zavolanie login z AuthContext
      await login(data.access, data.refresh, club, roles, categories, details);
      // 5. Presmerovanie po úspešnom prihlásení
      router.replace('/select-role');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };







  return (

      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/nazov-black.png')} style={styles.logotitle} />
          <Image source={require('../assets/images/ludimus.png')} style={styles.logo} />

        </View>

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
            <ActivityIndicator size="large" color="#000" />
        ) : (
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              <Text style={styles.buttonText}>Prihlásiť sa</Text>
            </TouchableOpacity>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#e0e0e0',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 40,
    fontStyle: 'italic',
    color: '#000'
  },
  // Prípadne ak máš obrázok:
   logo: {
     width: 250,
     height: 250,
     resizeMode: 'contain',
    marginBottom: 20,
   },
    logotitle: {
      width: 300,
      height: 120,
      resizeMode: 'contain',
    },
  title: {
    fontSize: 28,
    color: '#111',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#D32F2F',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  error: {
    color: '#D32F2F',
    marginBottom: 10,
    fontSize: 15,
    textAlign: 'center',
  },
});