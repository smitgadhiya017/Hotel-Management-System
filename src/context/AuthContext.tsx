import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  quickLogin: (email: string, role: AuthUser['role'], name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'grandstay_auth_user';
const STORAGE_KEY_TOKEN = 'grandstay_auth_token';

// Demo fallback accounts in case network is disconnected
const DEMO_FALLBACK_ACCOUNTS: Record<string, { pass: string; user: AuthUser }> = {
  'admin@grandstay.in': {
    pass: 'admin123',
    user: {
      id: 'usr_admin',
      email: 'admin@grandstay.in',
      name: 'Rajeshwar Rao',
      role: 'Administrator',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  },
  'manager@grandstay.in': {
    pass: 'manager123',
    user: {
      id: 'usr_manager',
      email: 'manager@grandstay.in',
      name: 'Sunita Kapoor',
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  },
  'reception@grandstay.in': {
    pass: 'reception123',
    user: {
      id: 'usr_reception',
      email: 'reception@grandstay.in',
      name: 'Amit Singhania',
      role: 'Receptionist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage and verify session
  useEffect(() => {
    async function initAuth() {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Background verification with backend
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
              }
            }
          } catch (e) {
            // Keep cached user if network fails
            console.warn('Backend session verification skipped (offline):', e);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        setIsLoading(false);
        return { success: true, message: data.message };
      }

      // Check fallback accounts if backend returned an error or is unreachable
      if (DEMO_FALLBACK_ACCOUNTS[cleanEmail] && DEMO_FALLBACK_ACCOUNTS[cleanEmail].pass === password) {
        const fallback = DEMO_FALLBACK_ACCOUNTS[cleanEmail].user;
        const fallbackToken = btoa(JSON.stringify({ id: fallback.id, email: fallback.email, role: fallback.role }));
        setUser(fallback);
        setToken(fallbackToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallback));
        localStorage.setItem(STORAGE_KEY_TOKEN, fallbackToken);
        setIsLoading(false);
        return { success: true, message: 'Logged in successfully (demo session)' };
      }

      setIsLoading(false);
      return { success: false, message: data.message || 'Invalid email or password' };
    } catch (err: unknown) {
      // Offline fallback
      if (DEMO_FALLBACK_ACCOUNTS[cleanEmail] && DEMO_FALLBACK_ACCOUNTS[cleanEmail].pass === password) {
        const fallback = DEMO_FALLBACK_ACCOUNTS[cleanEmail].user;
        const fallbackToken = btoa(JSON.stringify({ id: fallback.id, email: fallback.email, role: fallback.role }));
        setUser(fallback);
        setToken(fallbackToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallback));
        localStorage.setItem(STORAGE_KEY_TOKEN, fallbackToken);
        setIsLoading(false);
        return { success: true, message: 'Logged in successfully (offline demo mode)' };
      }

      const msg = err instanceof Error ? err.message : 'Login failed. Please check your network connection.';
      setIsLoading(false);
      return { success: false, message: msg };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role = 'Staff'
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        setIsLoading(false);
        return { success: true, message: data.message };
      }

      setIsLoading(false);
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: unknown) {
      // Offline fallback: allow local account creation
      const id = `usr_${Date.now()}`;
      const localUser: AuthUser = {
        id,
        email: cleanEmail,
        name: cleanName,
        role: role as AuthUser['role'],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=172554&color=fff`,
        createdAt: new Date().toISOString(),
      };
      const localToken = btoa(JSON.stringify({ id, email: cleanEmail, role }));
      setUser(localUser);
      setToken(localToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(localUser));
      localStorage.setItem(STORAGE_KEY_TOKEN, localToken);
      setIsLoading(false);
      return { success: true, message: 'Account created successfully (local mode)' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  };

  const quickLogin = (email: string, role: AuthUser['role'], name: string) => {
    const demoUser: AuthUser = {
      id: `usr_${role.toLowerCase()}`,
      email,
      name,
      role,
      avatar: DEMO_FALLBACK_ACCOUNTS[email]?.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=172554&color=fff`,
    };
    const demoToken = btoa(JSON.stringify({ id: demoUser.id, email: demoUser.email, role: demoUser.role }));
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(demoUser));
    localStorage.setItem(STORAGE_KEY_TOKEN, demoToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
