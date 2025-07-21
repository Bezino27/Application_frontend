import { useRouter } from 'expo-router';
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoggedIn, userRoles, logout } = useContext(AuthContext);

  useEffect(() => {
    if (isLoggedIn) {
      const roles = userRoles.map(r => r.role.toLowerCase());
      console.log(roles);
      if (roles.includes('hráč')) {
        router.replace('/tabs-player');
      } else if (roles.includes('tréner')) {
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
                  await logout();                // vyčistí AuthContext + AsyncStorage
                  router.replace('/login');      // manuálne presmerovanie
                }
              }
            ]
        );
      }
    }
  }, [isLoggedIn, userRoles]);

  return null;
}