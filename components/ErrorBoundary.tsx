import React from 'react';
import { View, Text } from 'react-native';

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: any }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("🛑 Zachytená chyba:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ padding: 20 }}>
                    <Text style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Chyba v aplikácii:</Text>
                    <Text>{this.state.error?.toString()}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}