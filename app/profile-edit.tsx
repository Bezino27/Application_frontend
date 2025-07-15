import React, { useContext, useState } from "react";
import { View, Text, TextInput, Button, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../hooks/api";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userDetails, accessToken,setUserDetails } = useContext(AuthContext);
  const [username, setuserName] = useState(userDetails?.username || "");
  const [email, setEmail] = useState(userDetails?.email || "");
  const [email2, setEmail2] = useState(userDetails?.email_2 || "");
  const [birthDate, setBirthDate] = useState(userDetails?.birth_date || "");
  const [height, setHeight] = useState(userDetails?.height || "");
  const [weight, setWeight] = useState(userDetails?.weight || "");
  const [side, setSide] = useState(userDetails?.side || "");
  const [number, setNumber] = useState(userDetails?.number || "");
  

const handleSave = async () => {
  try {
    const res = await fetch(`${BASE_URL}/me/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        username,
        email,
        email_2: email2,
        birth_date: birthDate,
        height,
        weight,
        side,
        number,
      }),
    });

    if (!res.ok) throw new Error("Nepodarilo sa uložiť údaje");

    // 🔁 Tu načítaj čerstvé údaje z GET /me/
    const refreshedRes = await fetch(`${BASE_URL}/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!refreshedRes.ok) throw new Error("Nepodarilo sa načítať nové údaje");

    const freshUserData = await refreshedRes.json();
    setUserDetails(freshUserData); // 👈 aktualizuj v kontexte

    Alert.alert("Úspech", "Údaje boli uložené");
    router.back();
  } catch (e) {
    Alert.alert("Chyba", "Skontroluj údaje alebo spojenie");
    console.error(e);
  }
};

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>username:</Text>
      <TextInput value={username} onChangeText={setuserName} style={inputStyle} />

      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} style={inputStyle} />

      <Text>Email 2:</Text>
      <TextInput value={email2} onChangeText={setEmail2} style={inputStyle} />

      <Text>Dátum narodenia:</Text>
      <TextInput value={birthDate} onChangeText={setBirthDate} style={inputStyle} />

      <Text>Výška:</Text>
      <TextInput value={height} onChangeText={setHeight} style={inputStyle} keyboardType="numeric" />

      <Text>Váha:</Text>
      <TextInput value={weight} onChangeText={setWeight} style={inputStyle} keyboardType="numeric" />

      <Text>Strana hokejky:</Text>
      <TextInput value={side} onChangeText={setSide} style={inputStyle} />

      <Text>Číslo na drese:</Text>
      <TextInput value={number} onChangeText={setNumber} style={inputStyle} />

      <Button title="Uložiť" onPress={handleSave} />
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: "#eee",
  marginBottom: 10,
  padding: 10,
  borderRadius: 5,
};