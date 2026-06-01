import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { JSX } from "react/jsx-dev-runtime";

/**
 * Wrapper untuk route khusus admin.
 * Harus dipakai BERSAMAAN dengan ProtectedRoute (yang sudah mengecek user login).
 *
 * Behavior:
 * - Saat masih loading auth → return null (ProtectedRoute sudah handle spinner)
 * - Kalau user bukan admin → redirect ke "/" + tampilkan toast peringatan
 * - Kalau user admin → render children
 */
export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { role, loading } = useAuth();

  // Pakai ref agar toast hanya muncul sekali per redirect, tidak spam
  const warned = useRef(false);

  useEffect(() => {
    if (!loading && role !== "admin" && !warned.current) {
      warned.current = true;
      toast.error("Anda tidak memiliki akses ke halaman ini");
    }
  }, [loading, role]);

  if (loading) return null;

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
