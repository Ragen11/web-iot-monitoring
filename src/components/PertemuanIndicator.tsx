import { useEffect, useState, useCallback } from "react";
import { FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/useAuth";

/**
 * Indikator "Minggu ke-" di navbar, di samping Tahun Ajaran Switcher.
 *
 * Sumber data: backend `/pertemuan/config` (minggu_berjalan) — SAMA dengan
 * halaman Pengaturan Pertemuan, agar angkanya konsisten.
 *
 * - Untuk admin: bisa diklik → menuju halaman Pengaturan Pertemuan.
 * - Untuk non-admin: hanya tampil (tidak bisa diklik).
 * - Mendengarkan event "pertemuan-config-changed" yang di-dispatch halaman
 *   pengaturan, sehingga ikut ter-update saat skip/kalender diubah.
 */
export default function PertemuanIndicator() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [minggu, setMinggu]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/pertemuan/config`);
      setMinggu(res.data?.minggu_berjalan ?? null);
    } catch {
      setMinggu(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchConfig();
    // Refetch saat config diubah dari halaman Pengaturan Pertemuan
    const handler = () => fetchConfig();
    window.addEventListener("pertemuan-config-changed", handler);
    return () => window.removeEventListener("pertemuan-config-changed", handler);
  }, [fetchConfig]);

  // Label tampilan
  const label = loading
    ? "Minggu ke -"
    : minggu !== null
    ? `Minggu ke-${minggu}`
    : "Di luar jadwal";

  const isAdmin = role === "admin";

  const content = (
    <>
      <FiClock size={13} className="text-primary shrink-0" />
      <span className="font-medium text-gray-700">{label}</span>
    </>
  );

  // Non-admin: chip statis (tidak interaktif)
  if (!isAdmin) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm"
        title="Minggu perkuliahan saat ini"
      >
        {content}
      </div>
    );
  }

  // Admin: tombol menuju Pengaturan Pertemuan
  return (
    <button
      onClick={() => navigate("/pengaturan-pertemuan")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-sm"
      title="Pengaturan Pertemuan"
    >
      {content}
    </button>
  );
}
