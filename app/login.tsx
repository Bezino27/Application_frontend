import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { loginWithCredentials } from '@/hooks/authHelpers';

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
      const result = await loginWithCredentials(username, password);
      const club = result.club ?? null;

      await login(
          result.access,
          result.refresh,
          club,
          result.roles,
          result.categories,
          result.details
      );

      router.replace('/select-role');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView
          style={{ flex: 1 , backgroundColor: '#e0e0e0'}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
              contentContainerStyle={[styles.container, { flexGrow: 1 }]}
              keyboardShouldPersistTaps="handled"
          >
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/nazov-black.png')} style={styles.logotitle} />
            <Image source={require('@/assets/images/ludimus.png')} style={styles.logo} />
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  logotitle: {
    width: 300,
    height: 120,
    resizeMode: 'contain',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
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
    fontStyle: 'italic',
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