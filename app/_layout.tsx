import { Slot, router } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

// Nastavenie správania pri prijatí notifikácie počas používania appky
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

type NotificationData = {
    type?: string;
    match_id?: number;
    user_id?: number;
    user_name?: string;
    screen?: string;
    // doplníme:
    payment?: boolean;
};
export default function RootLayout() {
    const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
    const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

    useEffect(() => {
        // Prijatá notifikácia počas používania appky
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('🔔 Prijatá notifikácia:', notification);
        });

        // Reakcia na kliknutie na notifikáciu
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data as NotificationData;

            if (data.type === 'match' && data.match_id) {
                router.push(`/match/${data.match_id}`);
            } else if (data.type === 'chat' && data.user_id && data.user_name) {
                router.push(`/chat/${data.user_id}?name=${encodeURIComponent(data.user_name)}`);
            } else if (data.type === 'payment') {
                router.push('/menu/payments'); // <- uprav podľa tvojej route
            } else if (data.screen === 'news.tsx') {
                router.push('/tabs-player/news');
            }
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    return (
        <PaperProvider>
            <AuthProvider>
                <ErrorBoundary>
                    <Slot />
                </ErrorBoundary>
            </AuthProvider>
        </PaperProvider>
    );
}