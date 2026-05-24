import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { db } from '../lib/store';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<boolean>;
  loginAdmin: (password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('abunasir_auth_id');
    const isAdmin = localStorage.getItem('abunasir_admin_auth') === 'true';
    
    if (isAdmin && savedUserId === 'super_admin') {
      setUser({
        id: 'super_admin',
        role: 'admin',
        name: 'System Admin',
        email: 'admin@system'
      });
    } else if (savedUserId) {
      const state = db.get();
      const loadedUser = state.users.find(u => u.id === savedUserId);
      if (loadedUser) setUser(loadedUser);
    }
    setIsLoading(false);
  }, []);

  const loginAdmin = (password: string) => {
    const trimmed = password.trim();
    if (trimmed === 'Abu Nasir' || trimmed.toLowerCase() === 'abu nasir') {
      const adminUser: User = {
        id: 'super_admin',
        role: 'admin',
        name: 'System Admin',
        email: 'admin@system'
      };
      setUser(adminUser);
      localStorage.setItem('abunasir_auth_id', 'super_admin');
      localStorage.setItem('abunasir_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const login = async (email: string) => {
    const foundUser = db.login(email);
    if (foundUser && foundUser.role !== 'admin') {
      setUser(foundUser);
      localStorage.setItem('abunasir_auth_id', foundUser.id);
      localStorage.setItem('abunasir_admin_auth', 'false');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('abunasir_auth_id');
    localStorage.removeItem('abunasir_admin_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAdmin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
