import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, LoginInput, AuthContextType } from '../types/auth';
import { loginApi, getCurrentUserApi, logoutApi } from '../api/auth';

const TOKEN_KEY = 'autotrack_token';
const USER_KEY = 'autotrack_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await getCurrentUserApi();
        if (isMounted) {
          setUser(response.user);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
      } catch (err) {
        // Invalid or expired session
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginInput) => {
    const response = await loginApi(credentials);
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
