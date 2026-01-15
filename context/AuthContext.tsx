import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState, } from 'react';
import { BASE_URL } from '@/hooks/api';
import * as Notifications from 'expo-notifications';
import { useRouter } from "expo-router";


export type UserRole = {
  role: string;
  category: {
    id: number;
    name: string;
  };
};

type Club = {
  id: number;
  name: string;
  description?: string;
  vote_lock_days?: number;  
  training_lock_hours?: number;
};

type UserDetails = {
  id: number;
  username: string;
  name: string;
  birth_date: string;
  number: string;
  email: string;
  email_2?: string;
  height?: string;
  weight?: string;
  side?: string;
  position?: { id: number; name: string } | null;
  preferred_role?: string | null;
  club?: Club | null;
};


type AuthContextType = {
  refreshAccessToken: () => Promise<string | null>;
  isLoggedIn: boolean | null;
  accessToken: string | null;
  userRoles: UserRole[];
  userCategories: string[];
  userClub: Club | null;
  login: (
      accessToken: string,
      refreshToken: string,
      club: Club | null,
      roles: UserRole[],
      categories: string[],
      userDetails: UserDetails
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUserRoles: (roles: UserRole[]) => Promise<void>;
  setUserClub: (club: Club | null) => Promise<void>;
  setUserCategories: (categories: string[]) => Promise<void>;
  userDetails: UserDetails | null;
  setUserDetails: (details: UserDetails | null) => Promise<void>;
  currentRole: UserRole | null;
  setCurrentRole: (role: UserRole | null) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  accessToken: null,
  userRoles: [],
  userCategories: [],
  userClub: null,
  userDetails: null,
  login: async () => {},
  logout: async () => {},
  setUserRoles: async () => {},
  setUserClub: async () => {},
  setUserCategories: async () => {},
  setUserDetails: async () => {},
  refreshAccessToken: async () => null,
  currentRole: null,
  setCurrentRole: async () => {},
});

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRoles, setUserRolesState] = useState<UserRole[]>([]);
  const [userCategories, setUserCategoriesState] = useState<string[]>([]);
  const [userClub, setUserClubState] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetailsState] = useState<UserDetails | null>(null);
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(null);
  const router = useRouter();


  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const rolesStr = await AsyncStorage.getItem('userRoles');
        const categoriesStr = await AsyncStorage.getItem('userCategories');
        const clubStr = await AsyncStorage.getItem('userClub');
        const detailsStr = await AsyncStorage.getItem('userDetails');
        const currentRoleStr = await AsyncStorage.getItem('currentRole');

        setAccessToken(token);

        if (token && !detailsStr) {
          await loadUserDetails(token); // načíta zo servera údaje, ak nie sú v AsyncStorage
        }

        if (rolesStr) {
          try {
            const rolesParsed = JSON.parse(rolesStr);
            setUserRolesState(Array.isArray(rolesParsed) ? rolesParsed : []);
          } catch {
            console.warn('userRoles JSON parse error');
            setUserRolesState([]);
          }
        }

        if (categoriesStr) {
          try {
            const categoriesParsed = JSON.parse(categoriesStr);
            setUserCategoriesState(Array.isArray(categoriesParsed) ? categoriesParsed : []);
          } catch {
            console.warn('userCategories JSON parse error');
            setUserCategoriesState([]);
          }
        }

        if (clubStr) {
          try {
            const clubParsed = JSON.parse(clubStr);
            setUserClubState(clubParsed);
          } catch {
            console.warn('userClub JSON parse error');
            setUserClubState(null);
          }
        }

        if (detailsStr) {
          try {
            const parsed = JSON.parse(detailsStr);
            setUserDetailsState(parsed);
          } catch {
            console.warn('userDetails JSON parse error');
            setUserDetailsState(null);
          }
        }

        if (currentRoleStr) {
          try {
            const parsed = JSON.parse(currentRoleStr);
            setCurrentRoleState(parsed);
          } catch {
            console.warn('currentRole JSON parse error');
            setCurrentRoleState(null);
          }
        }

      } catch (error) {
        console.error('Chyba pri načítaní údajov z AsyncStorage:', error);
        setUserRolesState([]);
        setUserCategoriesState([]);
        setUserClubState(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
  }, []);

  useEffect(() => {
    const tryRefreshOnStartup = async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) console.log("🔄 Token obnovený pri štarte appky");
      } catch (e) {
        console.warn("⚠️ Nepodarilo sa obnoviť token pri štarte:", e);
      }
    };
    // spustí sa po prvotnom načítaní údajov
    if (!isLoading) {
      tryRefreshOnStartup();
    }
  }, [isLoading]);

  const registerForPushNotificationsAsync = async (accessToken: string) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (finalStatus !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notifikácie neboli povolené');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenData.data;

      console.log('📱 Získaný Expo Push Token:', expoPushToken);

      await fetch(`${BASE_URL}/save-token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: expoPushToken }),
      });
    } catch (err) {
      console.error('❌ Chyba pri registrácii push notifikácií:', err);
    }
  };

  const login = async (
      access: string,
      refresh: string,
      club: Club | null,
      roles: UserRole[],
      categories: string[],
      userDetails: UserDetails
  ) => {
    try {
      await AsyncStorage.setItem('access', access);
      await AsyncStorage.setItem('refresh', refresh);
      await AsyncStorage.setItem('userRoles', JSON.stringify(roles));
      await AsyncStorage.setItem('userCategories', JSON.stringify(categories));
      if (club) {
        await AsyncStorage.setItem('userClub', JSON.stringify(club));
      } else {
        await AsyncStorage.removeItem('userClub');
      }
      await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
      setUserDetailsState(userDetails);
      setAccessToken(access);
      setUserRolesState(roles);
      setUserCategoriesState(categories);
      setUserClubState(club);

      // 🔥 Nastav currentRole na prvú s role 'player'
      let selectedRole: UserRole | null = null;

      if (userDetails?.preferred_role) {
        selectedRole = roles.find(r => r.role === userDetails.preferred_role) || null;
      }

      if (!selectedRole) {
        selectedRole = roles.find(r => r.role === 'player') || roles[0] || null;
      }

      setCurrentRoleState(selectedRole);

      if (selectedRole) {
        await AsyncStorage.setItem('currentRole', JSON.stringify(selectedRole));
      } else {
        await AsyncStorage.removeItem('currentRole');
      }

      await registerForPushNotificationsAsync(access);
    } catch (error) {
      console.error('Chyba pri login ukladaní do AsyncStorage:', error);
      throw error;
    }
  };



  const logout = async () => {
    await AsyncStorage.multiRemove(['access', 'refresh', 'userRoles', 'userCategories', 'userClub', 'userDetails', 'currentRole']);
    setAccessToken(null);
    setUserRolesState([]);
    setUserCategoriesState([]);
    setUserClubState(null);
    setUserDetailsState(null);
    setCurrentRoleState(null);
    router.replace('/login'); // ← presunie užívateľa na login

  };

  const updateUserRoles = async (roles: UserRole[]) => {
    setUserRolesState(roles);
    await AsyncStorage.setItem('userRoles', JSON.stringify(roles));
  };

  const updateUserCategories = async (categories: string[]) => {
    setUserCategoriesState(categories);
    await AsyncStorage.setItem('userCategories', JSON.stringify(categories));
  };

  const updateUserClub = async (club: Club | null) => {
    setUserClubState(club);
    if (club) {
      await AsyncStorage.setItem('userClub', JSON.stringify(club));
    } else {
      await AsyncStorage.removeItem('userClub');
    }
  };

  const updateUserDetails = async (details: UserDetails | null) => {
    setUserDetailsState(details);
    if (details) {
      await AsyncStorage.setItem('userDetails', JSON.stringify(details));
    } else {
      await AsyncStorage.removeItem('userDetails');
    }
  };

  const updateCurrentRole = async (role: UserRole | null) => {
    setCurrentRoleState(role);
    if (role) {
      await AsyncStorage.setItem('currentRole', JSON.stringify(role));
    } else {
      await AsyncStorage.removeItem('currentRole');
    }
  };

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refresh = await AsyncStorage.getItem("refresh");
    if (!refresh) {
      console.warn("⚠️ Žiadny refresh token, nemôžem obnoviť.");
      return null;
    }

    const response = await fetch(`${BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    // 🚫 Refresh token expiroval alebo je neplatný → jediné miesto, kde sa odhlásime
    if (response.status === 401) {
      console.warn("🚫 Refresh token expiroval alebo je neplatný – odhlasujem používateľa.");
      await logout();
      return null;
    }

    // ⚠️ Ak server hodí 500, 502, 403 alebo inú chybu – neodhlasuj
    if (response.status >= 500 || response.status === 403 || response.status === 404) {
      console.warn("⚠️ Server chyba pri refreshe (neodhlasujem):", response.status);
      return accessToken; // použijeme aktuálny token, nech fetchWithAuth skúsi znova neskôr
    }

    // Ak odpoveď nie je OK (napr. 400), neodhlasuj
    if (!response.ok) {
      console.warn("⚠️ Iný problém pri refreshe:", response.status);
      return accessToken;
    }

    // ✅ Refresh token je platný
    const data = await response.json();
    const newAccessToken = data.access;

    if (!newAccessToken) {
      console.warn("⚠️ Chýba nový access token v odpovedi, nechávam starý.");
      return accessToken;
    }

    await AsyncStorage.setItem("access", newAccessToken);
    setAccessToken(newAccessToken);

    // 🔄 Načítaj údaje používateľa po úspešnom refreshe
    try {
      const meRes = await fetch(`${BASE_URL}/me/`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });

      if (meRes.ok) {
        const data = await meRes.json();

        const user: UserDetails = {
          id: data.id,
          username: data.username,
          name: data.name,
          birth_date: data.birth_date,
          number: data.number,
          email: data.email,
          email_2: data.email_2,
          height: data.height,
          weight: data.weight,
          side: data.side,
          position: data.position,
          preferred_role: data.preferred_role,
          club: data.club ?? null,
        };

        await updateUserDetails(user);
        await updateUserRoles(data.roles ?? []);
        await updateUserCategories(data.assigned_categories ?? []);
        await updateUserClub(data.club ?? null);
      } else {
        console.warn("⚠️ Načítanie používateľa po refreshe zlyhalo:", meRes.status);
      }
    } catch (e) {
      console.warn("⚠️ Chyba pri načítaní používateľa po refreshe:", e);
    }

    return newAccessToken;
  } catch (error) {
    console.warn("⚠️ Chyba pri pokuse o refresh tokenu:", error);
    // ⚠️ NEODHLASUJ – môže byť offline alebo dočasný problém
    return accessToken;
  }
};



  const loadUserDetails = async (token: string) => {
    try {
      const res = await fetch(`${BASE_URL}/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserDetails = {
          id: data.id,
          username: data.username,
          name: data.name,
          birth_date: data.birth_date,
          number: data.number,
          email: data.email,
          email_2: data.email_2,
          height: data.height,
          weight: data.weight,
          side: data.side,
          position: data.position,
          preferred_role: data.preferred_role,
          club: data.club ?? null, 
        };
        await updateUserDetails(user);
      } else {
        console.warn("❌ Nepodarilo sa načítať používateľa");
      }
    } catch (e) {
      console.error("❌ Chyba pri fetchnutí používateľa:", e);
    }
  };


  return (
      <AuthContext.Provider
          value={{
            isLoggedIn: isLoading ? null : !!accessToken,
            accessToken,
            userRoles,
            userCategories,
            userClub,
            userDetails,
            login,
            logout,
            setUserRoles: updateUserRoles,
            setUserCategories: updateUserCategories,
            setUserClub: updateUserClub,
            setUserDetails: updateUserDetails,
            refreshAccessToken,
            currentRole,
            setCurrentRole: updateCurrentRole,

          }}
      >
        {children}
      </AuthContext.Provider>
  );
};