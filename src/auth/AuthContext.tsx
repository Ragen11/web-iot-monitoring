import { createContext, useContext, useEffect, useRef, useState } from "react";
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

  // 🔥 CHECK SESSION SAAT APP START
  const initialized = useRef(false);

  useEffect(() => {

    if (initialized.current) return;
    initialized.current = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("email", session.user.email)
          .single();

        if (profile) {
          setUser(profile.username);
          setRole(profile.role);
        }
      }

      setLoading(false);
    };

    getSession();

    // 🔥 LISTENER AUTO LOGIN / LOGOUT
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        if (session?.user) {

          const { data: profile } = await supabase
            .from("profiles")
            .select("username, role")
            .eq("email", session.user.email)
            .single();

          if (profile) {
            setUser(profile.username);
            setRole(profile.role);
          }

        } else {
          setUser(null);
          setRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
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