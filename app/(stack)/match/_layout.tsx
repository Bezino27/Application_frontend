import {Stack, Tabs, useRouter} from 'expo-router';
import {Image, TouchableOpacity} from "react-native";
import React from "react";

export default function MatchLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#fff",
                },
                headerTitleAlign: "center",
                headerTitle: () => (
                    <Image
                        source={require("@/assets/images/zapas_head.png")}
                        style={{ width: 180, height: 27, resizeMode: 'contain' }}
                    />
                ),
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10}}>
                        <Image
                            source={require('@/assets/images/spat_back.png')}
                            style={{ width: 60, height: 22, tintColor: '#D32F2F' }}
                        />
                    </TouchableOpacity>
                ),

            }}
        />
    );
}