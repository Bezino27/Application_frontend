import React, { useContext, useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";

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
      <Text>Vitaj Admin</Text>
      <Button title="Odhlásiť sa" onPress={logout} />
    </View>
  );
}