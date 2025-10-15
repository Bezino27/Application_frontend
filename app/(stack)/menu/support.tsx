import { View, Text, Image,StyleSheet } from "react-native";


export default function TabsIndex() {


    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/working.png')}
                style={styles.image}
            />
            <Text style={styles.text}>Na tejto stránke sa usilovne pracuje</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    image:{
        width: '80%',
        height: '60%',
        resizeMode: 'contain'
    },
    text:{
        fontWeight: 'bold',
        fontSize: 30,
        textAlign: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        padding:20
    }
})