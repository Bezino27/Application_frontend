import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import {Alert} from 'react-native';

export const useFetchWithAuth = () => {
  const { accessToken, refreshAccessToken, logout } = useContext(AuthContext);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // 🚨 1. Ak nemáme accessToken, ani sa nepokúšaj o fetch
    if (!accessToken) {
      console.warn("❌ Skipping fetch, no access token");
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

    // 🚨 2. Ak expiroval → refreshni
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await doRequest(newToken);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        console.warn("❌ Token refresh failed:", err);
        Alert.alert(
          "Relácia vypršala",
          "Prosím, prihlás sa znova.",
          [{ text: "OK", onPress: () => logout() }]
        );
        return new Response(null, { status: 401 });
      }
    }

    return response;
  };

  return { fetchWithAuth };
};