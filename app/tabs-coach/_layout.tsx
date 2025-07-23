import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image } from 'react-native';
export default function AdminTabsLayout() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.navigate('/(stack)/profile')}
                        style={{ marginRight: 15 }}
                    >

                        <Ionicons name="person-circle-outline" size={26} color="#000" />
                    </TouchableOpacity>
                ),
            }}
        >


            <Tabs.Screen
                name="news"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/moje udalosti.png')}
                            style={{ width: 180, height: 50, resizeMode: 'contain' }}
                        />
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}