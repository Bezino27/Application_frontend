import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' }, // ⛔️ skryje tab bar pre všetko
            }}
        />
    );
}