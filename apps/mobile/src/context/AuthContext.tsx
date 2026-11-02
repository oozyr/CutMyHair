import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Customer, CustomerPreferences } from '@cutmyhair/shared';
import { api, setAuthToken, setOnUnauthorized } from '@/api';

const TOKEN_KEY = 'cmh_session_token';

async function saveStorageToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).localStorage?.setItem(TOKEN_KEY, token);
    } catch {
      // Storage unavailable
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getStorageToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (globalThis as any).localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function removeStorageToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).localStorage?.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

interface AuthContextValue {
  user: Customer | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  requestOtp: (email: string) => Promise<{ success: boolean; isNewUser: boolean; message: string }>;
  verifyOtp: (dto: {
    email: string;
    code: string;
    name?: string;
    phone?: string;
    preferences?: CustomerPreferences;
  }) => Promise<Customer>;
  updateProfile: (dto: {
    name?: string;
    phone?: string;
    preferences?: CustomerPreferences;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  requestOtp: async () => ({ success: false, isNewUser: false, message: '' }),
  verifyOtp: async () => {
    throw new Error('AuthContext not initialized');
  },
  updateProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await removeStorageToken();
    } catch {
      // Ignore removal error
    }
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });

    async function initAuth() {
      try {
        const storedToken = await getStorageToken();
        if (storedToken) {
          setAuthToken(storedToken);
          try {
            const { customer } = await api.getMe();
            setUser(customer);
            setToken(storedToken);
          } catch {
            await removeStorageToken();
            setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        // Init failed
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [logout]);

  const requestOtp = useCallback(async (email: string) => {
    return api.requestOtp(email);
  }, []);

  const verifyOtp = useCallback(
    async (dto: {
      email: string;
      code: string;
      name?: string;
      phone?: string;
      preferences?: CustomerPreferences;
    }): Promise<Customer> => {
      const res = await api.verifyOtp(dto);
      await saveStorageToken(res.token);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.customer);
      return res.customer;
    },
    [],
  );

  const updateProfile = useCallback(
    async (dto: {
      name?: string;
      phone?: string;
      preferences?: CustomerPreferences;
    }) => {
      const { customer } = await api.updateMe(dto);
      setUser(customer);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        requestOtp,
        verifyOtp,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
