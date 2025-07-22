import { useRouter } from 'expo-router';
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoggedIn, userRoles, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoggedIn) return;

    const roles = Array.isArray(userRoles)
        ? userRoles.map(r => r?.role?.toLowerCase?.()).filter(Boolean)
        : [];

    console.log('Zistené roly:', roles);

    if (roles.includes('player')) {
      router.replace('/tabs-player');
    } else if (roles.includes('coach')) {
      router.replace('/tabs-coach');
    } else if (roles.includes('admin')) {
      router.replace('/tabs-admin');
    } else {
      Alert.alert(
          'Chyba',
          'Nemáš priradenú žiadnu rolu. Budeš odhlásený.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/login');
              }
            }
          ]
      );
    }
  }, [isLoggedIn, userRoles]);

  return null;
}