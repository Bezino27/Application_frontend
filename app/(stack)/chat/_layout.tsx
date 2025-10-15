import { Stack } from "expo-router";
import { Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from 'react-native';

export default function ChatLayout() {
    const router = useRouter();

    return (
        <Stack>
            <Stack.Screen
                name="chat-users"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/spravy_head.png')}
                            style={{ width: 180, height: 27, resizeMode: 'contain' }}
                        />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10,transform: [{ translateY: -4 }] }}>
                            <Image
                                source={require('@/assets/images/spat_back.png')}
                                style={{ width: 60, height: 22, tintColor: '#D32F2F' }}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Stack.Screen
                name="[userId]"
                options={({ route }) => {
                    const fullName = decodeURIComponent(route.params?.name || "Chat");
                    return {
                        headerTitle: () => (
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    transform: [{ translateY: -5 }],
                                    maxWidth: 200, // alebo percento podľa potreby
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {fullName}
                            </Text>
                        ),
                        headerTitleAlign: "center",
                        headerStyle: { backgroundColor: "#fff" },
                        headerTintColor: "#000",
                        height:'500',
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                                <Image
                                    source={require('@/assets/images/spravy_back.png')}
                                    style={{ width: 70, height: 30, tintColor: '#D32F2F', resizeMode: 'contain',transform: [{ translateY: -4 }],
                                    }}
                                />
                            </TouchableOpacity>
                        ),
                    };
                }}
            />
        </Stack>
    );
}