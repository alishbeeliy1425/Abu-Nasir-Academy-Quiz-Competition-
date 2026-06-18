import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { db } from "../lib/store";

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
    const initializeAuth = async () => {
      let savedUserId: string | null = null;
      let isAdmin = false;
      try {
        savedUserId = localStorage.getItem("abunasir_auth_id");
        isAdmin = localStorage.getItem("abunasir_admin_auth") === "true";
      } catch (err) {
        console.warn("localStorage is restricted", err);
      }

      if (isAdmin && savedUserId === "super_admin") {
        setUser({
          id: "super_admin",
          role: "admin",
          name: "System Admin",
          email: "admin@system",
        });
        setIsLoading(false);
        return;
      }

      if (savedUserId) {
        // Wait for sync so that remote users are populated with a 3-second timeout
        try {
          const { syncFromSupabase } = await import("../lib/store");
          await Promise.race([
            syncFromSupabase(false, savedUserId, null),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Sync timeout")), 3000),
            ),
          ]);
        } catch (e) {
          console.warn(
            "Sync delayed or failed, falling back to local memory:",
            e,
          );
        }

        const state = db.get();
        const loadedUser = state.users.find((u) => u.id === savedUserId);
        if (loadedUser) {
          setUser(loadedUser);
        } else {
          // Fallback if not found yet (maybe network delay)
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loginAdmin = (password: string) => {
    const trimmed = password.trim();
    if (trimmed === "Abu Nasir" || trimmed.toLowerCase() === "abu nasir") {
      const adminUser: User = {
        id: "super_admin",
        role: "admin",
        name: "System Admin",
        email: "admin@system",
      };
      setUser(adminUser);
      try {
        localStorage.setItem("abunasir_auth_id", "super_admin");
        localStorage.setItem("abunasir_admin_auth", "true");
      } catch (e) {}
      return true;
    }
    return false;
  };

  const login = async (email: string) => {
    const foundUser = db.login(email);
    if (foundUser && foundUser.role !== "admin") {
      setUser(foundUser);
      try {
        localStorage.setItem("abunasir_auth_id", foundUser.id);
        localStorage.setItem("abunasir_admin_auth", "false");
      } catch (e) {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("abunasir_auth_id");
      localStorage.removeItem("abunasir_admin_auth");
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginAdmin, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
