import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
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