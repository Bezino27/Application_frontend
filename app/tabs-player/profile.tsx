import React, { useContext, useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";

export default function TabsIndex() {
  const { isLoggedIn, logout, accessToken, userClub, userRoles, userCategories, userDetails  } = useContext(AuthContext);
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
      <Text>Vitaj Hráč</Text>
      <Text>Prihlásený: {isLoggedIn ? 'Áno' : 'Nie'}</Text>
      <Text>Klub: {userClub?.name}</Text>
      <Text>Username: {userDetails?.username}</Text>
      <Text>Email: {userDetails?.email}</Text>
      <Text>Email 2: {userDetails?.email_2}</Text>
      <Text>Roly: {userRoles.join(', ')}</Text>
      <Text>Kategorie: {userCategories.join(', ')}</Text>
      <Text>Meno: {userDetails?.name}</Text>
      <Text>Dátum narodenia: {userDetails?.birth_date}</Text>
      <Text>Výška: {userDetails?.height}</Text>
      <Text>Váha: {userDetails?.weight}</Text>
      <Text>Držanie: {userDetails?.side}</Text>
      <Button title="Upraviť profil" onPress={() => router.push("/profile-edit")} />
      <Button title="Odhlásiť sa" onPress={logout} />
    </View>
  );
}


