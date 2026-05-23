"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getSession,
  authLogin,
  authSignup,
  authLogout,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const authedUser = await authLogin(email, password, rememberMe);
      setUser(authedUser);
    },
    []
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const authedUser = await authSignup(username, email, password);
      setUser(authedUser);
    },
    []
  );

  const logout = useCallback(async () => {
    await authLogout();
    // Clear all stale local data so next login starts fresh
    if (typeof window !== "undefined") {
      localStorage.removeItem("taskzen_profile");
      localStorage.removeItem("taskzen_todos");
      localStorage.removeItem("taskzen_notes");
      localStorage.removeItem("timerSettings");
      localStorage.removeItem("focusai_session");
      localStorage.removeItem("focusai_users");
      localStorage.removeItem("focusai_testimonials");
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
