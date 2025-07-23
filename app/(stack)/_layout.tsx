import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, Image } from 'react-native';
import ProfileMenu from '@/components/ProfileMenu';

export default function StackLayout() {
    return (
        <Stack
            screenOptions={{
                gestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="profile"
                options={({ navigation }) => ({
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/Profile.png')}
                            style={{ width: 170, height: 25, resizeMode: 'contain' }}
                        />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}
                        >
                            <Ionicons name="arrow-back" size={22} color="#007AFF" />
                            <Text style={{ marginLeft: 4, fontSize: 16, color: '#007AFF' }}>Späť</Text>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <ProfileMenu /> // 👉 vlastný komponent
                    ),
                })}
            />
        </Stack>
    );
}