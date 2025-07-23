import React, { useContext, useEffect, useState } from "react";
import {View, Text, Button, StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import {text} from "node:stream/consumers";

export default function TabsIndex() {
    const { isLoggedIn, logout } = useContext(AuthContext);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoggedIn) {
            router.replace("/login");
        }
    }, [isLoggedIn, mounted]);

    if (!isLoggedIn) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Overujem prihlásenie...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.now}>Už čosokoro!</Text>
            <Text style={styles.row}>Ospravedlňujeme sa, na tejto stránke sa pracuje</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  row: {
      fontSize: 15,
      fontWeight: "bold",
  },
  now: {
    fontSize: 25,
    fontWeight: "bold",
    margin: 25,
  }
})
