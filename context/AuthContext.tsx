import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { BASE_URL } from '@/hooks/api';



type Club = {
  id: number;
  name: string;
  description?: string;
};

type UserDetails = {
  username: string;
  name: string;
  birth_date: string;
  number: string;
  email: string;
  email_2?: string;
  height?: string;
  weight?: string;
  side?: string;
};

type AuthContextType = {
  refreshAccessToken: () => Promise<string | null>; 
  isLoggedIn: boolean | null;
  accessToken: string | null;
  userRoles: string[];
  userCategories: string[];
  userClub: Club | null;
  login: (
  accessToken: string,
  refreshToken: string,
  club: Club | null,
  roles: string[],
  categories: string[],
  userDetails: UserDetails
) => Promise<void>;
  logout: () => Promise<void>;
  setUserRoles: (roles: string[]) => Promise<void>;
  setUserClub: (club: Club | null) => Promise<void>;
  setUserCategories: (categories: string[]) => Promise<void>;
  userDetails: UserDetails | null;
  setUserDetails: (details: UserDetails | null) => Promise<void>;
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
});

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRoles, setUserRolesState] = useState<string[]>([]);
  const [userCategories, setUserCategoriesState] = useState<string[]>([]);
  const [userClub, setUserClubState] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetailsState] = useState<UserDetails | null>(null);

  // 1️⃣ Načítanie údajov z AsyncStorage pri štarte
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const rolesStr = await AsyncStorage.getItem('userRoles');
        const categoriesStr = await AsyncStorage.getItem('userCategories');
        const clubStr = await AsyncStorage.getItem('userClub');
        const detailsStr = await AsyncStorage.getItem('userDetails');

        console.log('Načítané z AsyncStorage:', { token, rolesStr, categoriesStr, clubStr });

        setAccessToken(token);

        if (rolesStr) {
          try {
            const rolesParsed = JSON.parse(rolesStr);
            setUserRolesState(Array.isArray(rolesParsed) ? rolesParsed : []);
          } catch {
            console.warn('userRoles JSON parse error, nastavujem na []');
            setUserRolesState([]);
          }
        }

        if (categoriesStr) {
          try {
            const categoriesParsed = JSON.parse(categoriesStr);
            setUserCategoriesState(Array.isArray(categoriesParsed) ? categoriesParsed : []);
          } catch {
            console.warn('userCategories JSON parse error, nastavujem na []');
            setUserCategoriesState([]);
          }
        }

        if (clubStr) {
          try {
            const clubParsed = JSON.parse(clubStr);
            setUserClubState(clubParsed);
          } catch {
            console.warn('userClub JSON parse error, nastavujem na null');
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

  // 2️⃣ Login - uloží všetky údaje do AsyncStorage aj do React state
  const login = async (
    access: string,
    refresh: string,
    club: Club | null,
    roles: string[],
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
    } catch (error) {
      console.error('Chyba pri login ukladaní do AsyncStorage:', error);
      throw error;
    }
  };

  // 3️⃣ Logout - vymaže všetky údaje
  const logout = async () => {
    await AsyncStorage.multiRemove(['access', 'refresh', 'userRoles', 'userCategories', 'userClub']);
        await AsyncStorage.multiRemove(['access', 'refresh', 'userRoles', 'userCategories', 'userClub', 'userDetails']);
    setAccessToken(null);
    setUserRolesState([]);
    setUserCategoriesState([]);
    setUserClubState(null);
    setUserDetailsState(null);
  };

  // 4️⃣ Update helper funkcie pre ručnú zmenu
  const updateUserRoles = async (roles: string[]) => {
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

  const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refresh = await AsyncStorage.getItem('refresh');
    if (!refresh) return null;

    const response = await fetch(`${BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      throw new Error('Token refresh zlyhal');
    }

    const data = await response.json();
    const newAccessToken = data.access;

    await AsyncStorage.setItem('access', newAccessToken);
    setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Chyba pri obnove access tokenu:', error);
    await logout(); // automaticky odhlási pri neplatnom refresh tokene
    return null;
  }
  };

  // 5️⃣ Kontext poskytne všetko ostatným komponentom
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
        refreshAccessToken, // 🆕 pridaj sem
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};