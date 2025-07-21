import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu, Provider, IconButton } from "react-native-paper";

export default function ProfileScreen() {
  const {
    isLoggedIn,
    logout,
    userClub,
    userRoles,
    userCategories,
    userDetails,
  } = useContext(AuthContext);

  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, mounted]);

  const handleRoleChange = () => {
    router.replace("/select-role");
  };

  const handleEditProfile = () => {
    router.push("/profile-edit");
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  if (!isLoggedIn) {
    return (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Overujem prihlásenie...</Text>
        </View>
    );
  }

  return (
      <Provider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.heading}>
              👋 Vitaj, {userDetails?.name || "hráč"}
            </Text>
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <IconButton icon="dots-vertical" size={24} onPress={openMenu} />
                }
            >
              {userRoles.map((r: any, index: number) => {
                const roleKey = typeof r.role === "string" ? r.role.toLowerCase() : "";
                const roleLabel =
                    roleKey === "coach" || roleKey === "tréner" ? "Tréner" :
                        roleKey === "player" || roleKey === "hráč" ? "Hráč" :
                            roleKey === "admin" ? "Admin" :
                                roleKey === "parent" || roleKey === "rodič" ? "Rodič" :
                                    roleKey;

                const routeKey =
                    roleKey === "tréner" ? "coach" :
                        roleKey === "hráč" ? "player" :
                            roleKey === "rodič" ? "parent" :
                                roleKey;

                return (
                    <Menu.Item
                        key={index}
                        onPress={() => {
                          closeMenu();
                          router.replace(`/tabs-${routeKey}`);
                        }}
                        title={`🔄 ${roleLabel} (${r.category.name})`}
                    />
                );
              })}
              <Menu.Item onPress={handleEditProfile} title="Upraviť profil" />
              <Menu.Item onPress={logout} title="Odhlásiť sa" />
            </Menu>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
              <ProfileRow label="Používateľské meno" value={userDetails?.username} />
              <ProfileRow label="Email" value={userDetails?.email} />
              <ProfileRow label="Alternatívny email" value={userDetails?.email_2} />
              <ProfileRow label="Dátum narodenia" value={userDetails?.birth_date} />
              <ProfileRow label="Výška" value={userDetails?.height ? `${userDetails.height} cm` : ""} />
              <ProfileRow label="Váha" value={userDetails?.weight ? `${userDetails.weight} kg` : ""} />
              <ProfileRow label="Strana hokejky" value={userDetails?.side} />
              <ProfileRow label="Číslo na drese" value={userDetails?.number} />
              <ProfileRow label="Klub" value={userClub?.name} />
            </View>

            <Text style={styles.subheading}>🧩 Roly</Text>
            <View style={styles.rolesContainer}>
              {userRoles.map((r: any, index: number) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {`${typeof r.role === "string" ? r.role.toUpperCase() : "NEZNÁMA"} (${r.category.name})`}
                    </Text>
                  </View>
              ))}
            </View>
            <Text style={styles.subheading}>📂 Kategórie</Text>
            <View style={styles.rolesContainer}>
              {userCategories.map((cat, index) => (
                  <View key={index} style={styles.chipGray}>
                    <Text style={styles.chipTextDark}>{cat}</Text>
                  </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Provider>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e1e1e",
  },
  container: {
    padding: 20,
    paddingTop: 10,
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
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#4c68d7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: "#fff",
    fontWeight: "600",
  },
  chipGray: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipTextDark: {
    color: "#111",
    fontWeight: "500",
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