import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { BASE_URL } from '@/hooks/api';

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
      await logout();
      return null;
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