'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthUser, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, pass: string) => Promise<{ error?: string, user?: AuthUser }>;
  loginDemo: (role: UserRole) => Promise<void>;
  register: (data: Omit<User, 'id' | 'createdAt' | 'role'> & { role: UserRole, confirmPassword?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isShowroom: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Cleanup old mock data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('livlab_auth_user');
      localStorage.removeItem('livlab_users');
    }

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Failed to verify session', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Đăng nhập thất bại.' };
      }
      setUser(data.user);
      return { user: data.user };
    } catch (error) {
      return { error: 'Đã xảy ra lỗi mạng.' };
    }
  };

  const loginDemo = async (role: UserRole) => {
    let email = '';
    const pass = 'customer123456';
    let p = pass;
    if (role === 'CUSTOMER') {
      email = 'customer@livlab.vn';
      p = 'customer123456';
    } else if (role === 'SHOWROOM') {
      email = 'showroom@livlab.vn';
      p = 'showroom123456';
    } else {
      email = 'admin@livlab.vn';
      p = 'admin123456';
    }
    await login(email, p);
  };

  const register = async (data: Omit<User, 'id' | 'createdAt' | 'role'> & { role: UserRole, confirmPassword?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.error || 'Đăng ký thất bại.' };
      }
      return {};
    } catch (error) {
      return { error: 'Đã xảy ra lỗi mạng.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    }
    setUser(null);
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';
  const isShowroom = user?.role === 'SHOWROOM';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, register, logout, loading, isAdmin, isCustomer, isShowroom, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
