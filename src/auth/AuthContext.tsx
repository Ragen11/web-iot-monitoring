import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: string | null;
  role: "admin" | "user" | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role") as "admin" | "user" | null;

    if (storedUser) setUser(storedUser);
    if (storedRole) setRole(storedRole);
  }, []);

  // 🔥 LOGIN VIA SUPABASE
  const login = async (username: string, password: string) => {

    // 1. cari email dari username
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("username", username)
      .single();

    if (error || !profile) {
      return false;
    }

    // 2. login ke supabase
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (loginError) {
      return false;
    }

    // 3. simpan ke state
    localStorage.setItem("user", username);
    localStorage.setItem("role", profile.role);

    setUser(username);
    setRole(profile.role);

    return true;
  };

  // 🔥 LOGOUT SUPABASE
  const logout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}