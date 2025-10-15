import { Stack, router } from 'expo-router';
import { Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // expo install @expo/vector-icons
export default function MenuLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackVisible: false, // ← opravené
                headerTintColor: '#D32F2F',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 12 }}>
                        <Image
                            source={require('@/assets/images/spat.png')}
                            style={{ width: 70, height: 24, tintColor: '#D32F2F' }}
                        />
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen
                name="jerseys"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/dresy_head.png')}
                            style={{ width: 140, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="documents"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/dok_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="about_us"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/about_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="users"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/nazov-black.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/sett_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="orders_menu"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/obj_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="orders"
                options={{
                headerTitle: () => (
                    <Image
                    source={require("@/assets/images/FlorbalExpert_head.png")}
                    style={{
                        width: 150,
                        height: 40,
                        resizeMode: "contain",
                        alignSelf: "center",
                    }}
                    />
                ),
                headerRight: () => (
                    <TouchableOpacity
                    onPress={() =>
                        Alert.alert(
                            "Informácie o objednávkach FlorbalExpert",
                            "Objednávky sa realizujú prostredníctvom obchodu FlorbalExpert.\n\n" +
                                "Zľava je 40 % na všetok nezľavnený tovar. Ak je produkt už zľavnený (napr. 20 %), aplikuje sa dodatočná zľava do celkových 40 %.\n\n" +
                                "Objednávka bude záväzne odoslaná do obchodu až po nazbieraní minimálnej sumy 400 €.\n\n" +
                                "Pri vytváraní objednávky je potrebné vybrať správny tovar, vyplniť všetky údaje a potvrdiť. Následne vám admin vygeneruje konečnú sumu a platobné údaje.\n\n" +
                                "Objednávka bude odoslaná a doručená až po uhradení poplatku."
                        )
                    }
                    style={{ marginRight: 12 }}
                    >
                    <Ionicons name="information-circle-outline" size={24} color="#444" />
                    </TouchableOpacity>
                ),
                }}
            />

            <Stack.Screen
                name="jersey_order"
                options={{
                headerTitle: () => (
                    <Image
                    source={require("@/assets/images/dresy_head.png")}
                    style={{
                        width: 150,
                        height: 40,
                        resizeMode: "contain",
                        alignSelf: "center",
                    }}
                    />
                ),
                headerRight: () => (
                    <TouchableOpacity
                    onPress={() =>
                        Alert.alert(
                        "Informácie o objednávke dresov",
                        "Pri objednávke dresu je potrebné vyplniť všetky požadované údaje:\n\n" +
                            "• Zadaj priezvisko presne tak, ako ho chceš mať uvedené na drese.\n" +
                            "• Zvoľ si veľkosť dresu aj kraťasov (XXS – XXL).\n" +
                            "• Vyber číslo na dres. Pri výbere čísla sa zobrazia všetci členovia klubu, ktorí už dané číslo používajú.\n\n" +
                            "Dôležité pravidlo: Číslo na drese nemôžeš mať rovnaké ako hráč, ktorého rok narodenia je v rozmedzí +- 3 roky od tvojho ročníka.\n" +
                            "Príklad: ak si ročník 2009, nesmieš si zvoliť číslo, ktoré už používa hráč narodený v rokoch 2007, 2008, 2009, 2010, 2011 alebo 2012.\n\n" +
                            "Objednávka bude záväzná až po potvrdení a kontrole klubom."
                        )
                    }
                    style={{ marginRight: 12 }}
                    >
                    <Ionicons name="information-circle-outline" size={24} color="#444" />
                    </TouchableOpacity>
                ),
                }}
            />


            <Stack.Screen
                name="payments"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/plat_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="contact"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/cont_head.png')}
                            style={{ width: 200, height: 40, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
            <Stack.Screen
                name="attendance"
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('@/assets/images/dochazka_head.png')}
                            style={{ width: 180, height: 35, resizeMode: 'contain', alignSelf: 'center' }}
                        />
                    ),
                }}
            />
        </Stack>
    );
}