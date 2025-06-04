import { AuthContext } from '@/context/AuthContext';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BASE_URL } from '../../hooks/api';

interface Club {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  club: Club | null;
}

export default function CategoriesScreen() {
  const { accessToken } = useContext(AuthContext);

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načítanie používateľa podľa tokenu
  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken) {
        setError('Nie ste prihlásený');
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      setError(null);

      try {
        const response = await fetch(`${BASE_URL}/me/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Chyba pri načítaní používateľa: ${response.status}`);
        }

        const userData: User = await response.json();
        setUser(userData);
      } catch (err: any) {
        setError(err.message || 'Neznáma chyba pri načítaní používateľa');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [accessToken]);

  // Načítanie kategórií podľa club.id používateľa
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user?.club) {
        setCategories([]);
        return;
      }

      setLoadingCategories(true);
      setError(null);

      try {
        const response = await fetch(
          `${BASE_URL}/categories/${user.club.id}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Chyba pri načítaní kategórií: ${response.status}`);
        }

        const categoriesData: Category[] = await response.json();
        setCategories(categoriesData);
      } catch (err: any) {
        setError(err.message || 'Neznáma chyba pri načítaní kategórií');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [user, accessToken]);

  if (loadingUser) return <Text>Načítavam používateľa...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Kategórie klubu: {user?.club?.name ?? 'Žiadny klub'}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {loadingCategories ? (
        <Text>Načítavam kategórie...</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.name}>{item.name}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>Žiadne kategórie</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  error: { color: 'red', marginBottom: 10 },
  title: { fontSize: 20, marginBottom: 15 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  name: { fontSize: 18 },
});