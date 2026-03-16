import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: string | null;
  role: "admin" | "user" | null;
  login: (username: string, password: string) => boolean;
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

  const login = (username: string, password: string) => {

    // ADMIN
    if (username === "admin" && password === "123") {
      localStorage.setItem("user", username);
      localStorage.setItem("role", "admin");

      setUser(username);
      setRole("admin");

      return true;
    }

    // USER
    if (username === "user" && password === "123") {
      localStorage.setItem("user", username);
      localStorage.setItem("role", "user");

      setUser(username);
      setRole("user");

      return true;
    }

    return false;
  };

  const logout = () => {
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