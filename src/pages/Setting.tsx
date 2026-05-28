import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  FiUser,
  FiInfo,
  FiLogOut,
  FiShield,
} from "react-icons/fi";

export default function Setting() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      <h1 className="text-xl font-semibold">Pengaturan</h1>

      {/* PROFIL */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FiUser className="text-[#A44A4A]" size={18} />
          <h2 className="font-semibold text-gray-700">Profil</h2>
        </div>

        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#A44A4A]/30 flex-shrink-0">
            <img
              src="https://i.pravatar.cc/100"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{user}</p>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${
                role === "admin"
                  ? "bg-red-100 text-[#A44A4A]"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {role === "admin" ? "Administrator" : "Dosen"}
            </span>
          </div>
        </div>
      </div>

      {/* INFO APLIKASI */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FiInfo className="text-[#A44A4A]" size={18} />
          <h2 className="font-semibold text-gray-700">Info Aplikasi</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Nama Aplikasi</span>
            <span className="font-medium text-gray-700">Klaktify</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Versi</span>
            <span className="font-medium text-gray-700">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Platform</span>
            <span className="font-medium text-gray-700">Web Application</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Tech Stack</span>
            <span className="font-medium text-gray-700">React + TypeScript + Supabase</span>
          </div>
          <div className="pt-1">
            <p className="text-gray-400 text-xs leading-relaxed">
              Klaktify adalah sistem monitoring perkuliahan berbasis web yang membantu
              institusi pendidikan dalam memantau sesi kelas, menganalisis aktivitas pembelajaran,
              dan menghasilkan laporan evaluasi secara otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* KEAMANAN */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FiShield className="text-[#A44A4A]" size={18} />
          <h2 className="font-semibold text-gray-700">Keamanan</h2>
        </div>

        <div className="text-sm space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Auto logout</span>
            <span className="font-medium text-gray-700">12 menit tidak aktif</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Sesi</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Aktif
            </span>
          </div>
        </div>
      </div>

      {/* AKUN — LOGOUT */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FiLogOut className="text-red-500" size={18} />
          <h2 className="font-semibold text-gray-700">Akun</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Keluar dari sesi ini. Anda perlu login kembali untuk mengakses aplikasi.
        </p>

        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition"
        >
          <FiLogOut size={15} />
          Logout
        </button>

      <ConfirmDialog
        open={confirmLogout}
        title="Konfirmasi Logout"
        message="Anda akan keluar dari sesi ini. Lanjutkan?"
        confirmLabel="Ya, Logout"
        onConfirm={() => { setConfirmLogout(false); handleLogout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
      </div>
    </div>
  );
}
