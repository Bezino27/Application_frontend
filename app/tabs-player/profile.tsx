import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsIndex() {
  const {
    isLoggedIn,
    logout,
    userClub,
    userRoles,
    userCategories,
    userDetails,
  } = useContext(AuthContext);

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
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Overujem prihlásenie...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>👋 Vitaj, {userDetails?.name || "hráč"}</Text>

        <View style={styles.card}>
          <ProfileRow label="Username" value={userDetails?.username} />
          <ProfileRow label="Email" value={userDetails?.email} />
          {userDetails?.email_2 && <ProfileRow label="Email 2" value={userDetails.email_2} />}
          <ProfileRow label="Dátum narodenia" value={userDetails?.birth_date} />
          <ProfileRow label="Výška" value={userDetails?.height ? `${userDetails.height} cm` : ""} />
          <ProfileRow label="Váha" value={userDetails?.weight ? `${userDetails.weight} kg` : ""} />
          <ProfileRow label="Strana hokejky" value={userDetails?.side} />
          <ProfileRow label="Číslo na drese" value={userDetails?.number} />
          <ProfileRow label="Klub" value={userClub?.name} />
          <ProfileRow label="Roly" value={userRoles.join(", ")} />
          <ProfileRow label="Kategórie" value={userCategories.join(", ")} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => router.push("/profile-edit")}
        >
          <Text style={styles.buttonText}>✏️ Upraviť profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={logout}
        >
          <Text style={styles.buttonText}>🚪 Odhlásiť sa</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ProfileRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f8",
  },
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e1e1e",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  label: {
    color: "#555",
    fontWeight: "600",
    fontSize: 15,
    flex: 1.2,
  },
  value: {
    color: "#222",
    fontSize: 15,
    flex: 1.5,
    textAlign: "right",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});