import React from 'react';
import { Image, StyleSheet, Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");

export default function AboutUsScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={true}
            >
                <View style={{ paddingLeft: 10, paddingRight: 0 }}>
                    <Image
                        source={require('@/assets/images/oaplikacii.png')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    image: {  
        width: width,           // nech sa natiahne v rámci maxWidth
        height: undefined,
        aspectRatio: 1630 / 3600, 
        alignSelf: 'center',     // kľúčové na centrovanie
    },
});
