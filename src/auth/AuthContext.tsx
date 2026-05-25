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

    console.log("[Auth] AuthProvider initializing...");

    // Safety timeout: paksa loading=false setelah 4 detik
    // agar tidak stuck putih meski Supabase hang
    const safetyTimeout = setTimeout(() => {
      console.warn("[Auth] Safety timeout triggered — forcing loading=false");
      setLoading(false);
    }, 4000);

    // Helper: jalankan promise dengan timeout
    const withTimeout = <T,>(p: PromiseLike<T>, ms: number, label: string): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
        ),
      ]);

    const fetchProfile = async (email: string) => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .select("username, role")
            .eq("email", email)
            .maybeSingle(),
          3000,
          "fetch profile"
        );
        if (error) console.error("[Auth] Profile error:", error);
        return data;
      } catch (err) {
        console.error("[Auth] fetchProfile failed:", err);
        return null;
      }
    };

    const getSession = async () => {
      try {
        console.log("[Auth] Getting session...");
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          3000,
          "getSession"
        );
        console.log("[Auth] Session:", session ? "exists" : "none");

        if (session?.user?.email) {
          const profile = await fetchProfile(session.user.email);
          if (profile) {
            setUser(profile.username);
            setRole(profile.role);
            console.log("[Auth] Logged in as:", profile.username);
          }
        }
      } catch (err) {
        console.error("[Auth] getSession failed:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    getSession();

    // 🔥 LISTENER AUTO LOGIN / LOGOUT
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] State change:", event);
        try {
          if (session?.user?.email) {
            const profile = await fetchProfile(session.user.email);
            if (profile) {
              setUser(profile.username);
              setRole(profile.role);
            }
          } else {
            setUser(null);
            setRole(null);
          }
        } catch (err) {
          console.error("[Auth] State change failed:", err);
        } finally {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    );

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