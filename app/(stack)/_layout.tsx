import { Stack, router } from 'expo-router';
import { TouchableOpacity, Image, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const isSmallScreen = screenWidth < 360;

export default function StackLayout() {
    const headerImageSize = isSmallScreen ? 130 : 170;
    const backButtonWidth = isSmallScreen ? 45 : 60;
    const backImageHeight = isSmallScreen ? 18 : 22;

    return (
        <Stack
            screenOptions={{
                gestureEnabled: true,
                headerShown: false,
            }}
        >
            {[
                { name: "training/[id]" },
                { name: "training/manage/[id]" },
                { name: "match/[id]" }, // ← sem
            ].map(({ name }) => (
                <Stack.Screen
                    key={name}
                    name={name}
                    options={{
                        headerShown: true,
                        headerTitle: () => (
                            <Image
                                source={
                                    name.includes("training")
                                        ? require('@/assets/images/treining.png')
                                        : require('@/assets/images/matches.png') // ← nový obrázok zápasu
                                }
                                style={{
                                    width: headerImageSize,
                                    height: 30,
                                    resizeMode: 'contain',
                                    transform: [{ translateY: -2 }],
                                }}
                            />
                        ),
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{ paddingLeft: 12, flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Image
                                    source={require('@/assets/images/spat.png')}
                                    style={{
                                        width: backButtonWidth,
                                        height: backImageHeight,
                                        tintColor: '#D32F2F',
                                        transform: [{ translateY: -2 }],
                                    }}
                                />
                            </TouchableOpacity>
                        ),
                    }}
                />
            ))}

            <Stack.Screen
                name="change-password"
                options={{
                    headerShown: true,
                    title: 'Zmeniť heslo',
                    headerTintColor: '#D32F2F',
                    headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: '#fff' },
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: isSmallScreen ? 16 : 18,
                        color: '#000',
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ paddingLeft: 12, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Image
                                source={require('@/assets/images/spat.png')}
                                style={{
                                    width: backButtonWidth,
                                    height: backImageHeight,
                                    tintColor: '#D32F2F'
                                }}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />
                       <Stack.Screen
                name="forgot_password"
                options={{
                    headerShown: true,
                    title: 'Zabudnuté heslo',
                    headerTintColor: '#D32F2F',
                    headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: '#fff' },
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: isSmallScreen ? 16 : 18,
                        color: '#000',
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ paddingLeft: 12, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Image
                                source={require('@/assets/images/spat.png')}
                                style={{
                                    width: backButtonWidth,
                                    height: backImageHeight,
                                    tintColor: '#D32F2F'
                                }}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    headerShown: true,
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/Profile.png')}
                            style={{
                                width: isSmallScreen ? 130 : 170,
                                height: 25,
                                resizeMode: 'contain',
                                transform: [{ translateY: -2 }],
                            }}
                        />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ paddingLeft: 12, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Image
                                source={require('@/assets/images/spat.png')}
                                style={{
                                    width: backButtonWidth,
                                    height: backImageHeight,
                                    tintColor: '#D32F2F'
                                }}
                            />
                        </TouchableOpacity>
                    ),
                /*headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 15, transform: [{ translateY: -4 }] }}>
                            <ProfileMenu />
                        </TouchableOpacity>
                    ),*/
                }}
            />
        </Stack>
    );
}