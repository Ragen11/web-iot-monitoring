import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: string | null;
  role: "admin" | "user" | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    console.log("[Auth] AuthProvider initializing...");

    // Safety timeout: paksa loading=false setelah 5 detik
    const safetyTimeout = setTimeout(() => {
      console.warn("[Auth] Safety timeout triggered — forcing loading=false");
      setLoading(false);
    }, 5000);

    // Fetch profile dari email — DI LUAR auth callback agar tidak deadlock
    const fetchProfile = async (email: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("email", email)
          .maybeSingle();

        if (error) {
          console.error("[Auth] Profile error:", error);
        }
        if (data) {
          setUser(data.username);
          setRole(data.role);
          console.log("[Auth] Logged in as:", data.username);
        }
      } catch (err) {
        console.error("[Auth] fetchProfile failed:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    // ⚠️ PENTING: callback HARUS sinkron / tidak await Supabase
    // Async work dipindah ke setTimeout(0) untuk keluar dari auth lock
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] State change:", event);

      if (session?.user?.email) {
        const email = session.user.email;
        // Defer fetch keluar dari callback agar tidak deadlock dengan internal lock Supabase
        setTimeout(() => fetchProfile(email), 0);
      } else {
        setUser(null);
        setRole(null);
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      listener.subscription.unsubscribe();
    };

  }, []);

  // 🔐 LOGIN
  const login = async (username: string, password: string) => {

    // cari email dari username
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email, username, role")
      .eq("username", username)
      .single();

    if (error || !profile) {
      return false;
    }

    // login ke supabase
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (loginError) {
      return false;
    }

    setUser(profile.username);
    setRole(profile.role);

    return true;
  };

  // 🔓 LOGOUT
  const logout = async () => {
    setUser(null);
    setRole(null);

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
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