import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { Alert } from "react-native";

export const useFetchWithAuth = () => {
  const { accessToken, refreshAccessToken, logout } = useContext(AuthContext);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // 🚨 Ak nemáme access token, nerob request
    if (!accessToken) {
      console.warn("❌ Chýba access token – fetch sa preskočí");
      return new Response(null, { status: 401 });
    }

    const doRequest = async (token: string) => {
      return await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    };

    let response = await doRequest(accessToken);

    // 🚨 Ak API vráti 401 → skús refresh
    if (response.status === 401) {
      console.warn("⚠️ Access token expiroval, skúšam obnoviť...");

      const newToken = await refreshAccessToken();

      if (newToken) {
        // 🔄 Refresh sa podaril → sprav request znova
        response = await doRequest(newToken);
      } else {
        console.warn("⚠️ Nepodarilo sa obnoviť token – možno offline?");
        // ⚠️ Skontroluj, či nie je používateľ offline
        try {
          const online = await fetch("https://www.google.com", { method: "HEAD" });
          if (!online.ok) throw new Error("Offline alebo zly sieťový stav");
        } catch {
          // Ak je offline, neodhlasuj – len upozorni
          Alert.alert("Bez pripojenia", "Nie ste pripojený k internetu.");
          return new Response(null, { status: 0 });
        }

        // 🚫 Ak nie je offline, ale refresh zlyhal (token expiroval)
        Alert.alert(
          "Relácia vypršala",
          "Tvoje prihlásenie už nie je platné. Prihlás sa prosím znova.",
          [{ text: "OK", onPress: () => logout() }]
        );
        return new Response(null, { status: 401 });
      }
    }

    return response;
  };

  return { fetchWithAuth };
};
