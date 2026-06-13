import { FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { calculateMingguKe, isSkipWeek } from "../lib/semester";

/**
 * Indikator "Minggu ke-" di navbar, di samping Tahun Ajaran Switcher.
 *
 * - Menampilkan minggu perkuliahan saat ini (dihitung dari tanggal hari ini).
 * - Untuk admin: bisa diklik → menuju halaman Pengaturan Pertemuan.
 * - Untuk non-admin: hanya tampil (tidak bisa diklik), karena halaman
 *   pengaturan + upload kalender akademik khusus admin.
 */
export default function PertemuanIndicator() {
  const { role } = useAuth();
  const navigate = useNavigate();

  // Tanggal lokal hari ini sebagai "YYYY-MM-DD" (hindari pergeseran UTC)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const minggu = calculateMingguKe(today);
  const skip = isSkipWeek(today);

  // Label tampilan
  const label = skip
    ? "Minggu SKIP"
    : minggu !== null
    ? `Minggu ke-${minggu}`
    : "Minggu ke -";

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
