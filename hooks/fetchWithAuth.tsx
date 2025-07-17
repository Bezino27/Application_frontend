import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export const useFetchWithAuth = () => {
  const { accessToken, refreshAccessToken, logout } = useContext(AuthContext);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const doRequest = async (token: string | null) => {
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
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        await logout();
        return response;
      }
      response = await doRequest(newToken);
    }

    return response;
  };

  return { fetchWithAuth };
};