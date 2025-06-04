import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

type Club = {
  id: number;
  name: string;
  description?: string;
};

type AuthContextType = {
  isLoggedIn: boolean | null;
  accessToken: string | null;
  userRoles: string[];
  userClub: Club | null;
  login: (
    accessToken: string,
    refreshToken: string,
    club: Club | null,
    roles: string[]
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUserRoles: (roles: string[]) => Promise<void>;
  setUserClub: (club: Club | null) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  accessToken: null,
  userRoles: [],
  userClub: null,
  login: async () => {},
  logout: async () => {},
  setUserRoles: async () => {},
  setUserClub: async () => {},
});

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRoles, setUserRolesState] = useState<string[]>([]);
  const [userClub, setUserClubState] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Načítavanie z AsyncStorage pri štarte appky
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const rolesStr = await AsyncStorage.getItem('userRoles');
        const clubStr = await AsyncStorage.getItem('userClub');

        console.log('Načítané z AsyncStorage:', { token, rolesStr, clubStr });

        setAccessToken(token);

        if (rolesStr) {
          try {
            const rolesParsed = JSON.parse(rolesStr);
            setUserRolesState(Array.isArray(rolesParsed) ? rolesParsed : []);
          } catch {
            console.warn('userRoles JSON parse error, nastavujem na []');
            setUserRolesState([]);
          }
        } else {
          setUserRolesState([]);
        }

        if (clubStr) {
          try {
            const clubParsed = JSON.parse(clubStr);
            setUserClubState(clubParsed);
          } catch {
            console.warn('userClub JSON parse error, nastavujem na null');
            setUserClubState(null);
          }
        } else {
          setUserClubState(null);
        }
      } catch (error) {
        console.error('Chyba pri načítaní údajov z AsyncStorage', error);
        setUserRolesState([]);
        setUserClubState(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Debug log po každej zmene userClub
  useEffect(() => {
    console.log('Aktuálny userClub (zmenený):', userClub);
  }, [userClub]);

  const login = async (
    access: string,
    refresh: string,
    club: Club | null,
    roles: string[]
  ) => {
    try {
      await AsyncStorage.setItem('access', access);
      await AsyncStorage.setItem('refresh', refresh);
      await AsyncStorage.setItem('userRoles', JSON.stringify(roles));
      if (club) {
        await AsyncStorage.setItem('userClub', JSON.stringify(club));
      } else {
        await AsyncStorage.removeItem('userClub');
      }

      setAccessToken(access);
      setUserRolesState(roles);
      setUserClubState(club);
    } catch (error) {
      console.error('Chyba pri login ukladaní do AsyncStorage:', error);
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access', 'refresh', 'userRoles', 'userClub']);
    setAccessToken(null);
    setUserRolesState([]);
    setUserClubState(null);
  };

  const updateUserRoles = async (roles: string[]) => {
    setUserRolesState(roles);
    await AsyncStorage.setItem('userRoles', JSON.stringify(roles));
  };

  const updateUserClub = async (club: Club | null) => {
    setUserClubState(club);
    if (club) {
      await AsyncStorage.setItem('userClub', JSON.stringify(club));
    } else {
      await AsyncStorage.removeItem('userClub');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoading ? null : !!accessToken,
        accessToken,
        userRoles,
        userClub,
        login,
        logout,
        setUserRoles: updateUserRoles,
        setUserClub: updateUserClub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};