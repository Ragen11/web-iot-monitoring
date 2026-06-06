import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiPlus,
  FiCheck,
  FiTrash2,
  FiCalendar,
  FiBookOpen,
  FiBook,
} from "react-icons/fi";
import { useTahunAjaran, type TahunAjaran } from "../context/TahunAjaranContext";
import ConfirmDialog from "../components/ConfirmDialog";
import AssignUnassignedModal from "../components/AssignUnassignedModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function TahunAjaranPage() {
  const { list, aktif, loading, refresh } = useTahunAjaran();

  // Form input
  const [showForm, setShowForm] = useState(false);
  const [tahunInput, setTahunInput] = useState("");
  const [creating, setCreating] = useState(false);

  // Aksi per row
  const [activating, setActivating]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TahunAjaran | null>(null);

  // Assign data lama modal
  const [showAssign, setShowAssign] = useState<"jadwal" | "rps" | null>(null);

  const handleCreate = async () => {
    const tahun = tahunInput.trim();
    if (!tahun) {
      toast.error("Tahun ajaran wajib diisi");
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(tahun)) {
      toast.error("Format harus 'YYYY/YYYY' (contoh: '2025/2026')");
      return;
    }

    try {
      setCreating(true);
      await axios.post(`${API_URL}/tahun-ajaran`, { tahun });
      toast.success(`Tahun ajaran ${tahun} berhasil dibuat`);
      setTahunInput("");
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Gagal membuat TA"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (ta: TahunAjaran) => {
    try {
      setActivating(ta.id);
      await axios.patch(`${API_URL}/tahun-ajaran/${ta.id}`, {
        is_aktif: true,
      });
      toast.success(`${ta.label} sekarang aktif`);
      await refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Gagal mengaktifkan"
      );
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/tahun-ajaran/${deleteTarget.id}`);
      toast.success(`${deleteTarget.label} berhasil dihapus`);
      setDeleteTarget(null);
      await refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Gagal menghapus TA"
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tahun Ajaran</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Kelola tahun ajaran, set yang aktif, dan assign data ke TA
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition"
        >
          <FiPlus size={16} />
          Tambah Tahun Ajaran
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FiCalendar className="text-primary" size={16} />
            Tahun Ajaran Baru
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Akan dibuat 2 semester sekaligus (Ganjil + Genap)
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={tahunInput}
              onChange={(e) => setTahunInput(e.target.value)}
              placeholder="Contoh: 2025/2026"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              disabled={creating}
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition disabled:opacity-50"
            >
              {creating ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setTahunInput("");
              }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* QUICK ACTION: Assign data lama */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-1">Assign Data Lama</h2>
        <p className="text-xs text-gray-400 mb-4">
          Tag data jadwal/RPS yang belum punya tahun ajaran
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAssign("jadwal")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <FiBookOpen size={14} className="text-primary" />
            Assign Jadwal
          </button>
          <button
            onClick={() => setShowAssign("rps")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <FiBook size={14} className="text-primary" />
            Assign RPS
          </button>
        </div>
      </div>

      {/* LIST TAHUN AJARAN */}
      <div className="space-y-3">
        {loading && list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 text-sm">
            Memuat daftar tahun ajaran...
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 text-sm">
            Belum ada tahun ajaran. Klik "Tambah Tahun Ajaran" untuk membuat.
          </div>
        ) : (
          list.map((ta) => {
            const isAktif = ta.is_aktif;
            return (
              <div
                key={ta.id}
                className={`bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  isAktif ? "ring-2 ring-primary/30" : ""
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">
                      {ta.label}
                    </h3>
                    {isAktif && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>
                      Jadwal: <strong>{ta.jadwal_count ?? 0}</strong>
                    </span>
                    <span>
                      RPS: <strong>{ta.rps_count ?? 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!isAktif && (
                    <button
                      onClick={() => handleActivate(ta)}
                      disabled={activating === ta.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition disabled:opacity-50"
                    >
                      <FiCheck size={13} />
                      {activating === ta.id ? "Mengaktifkan..." : "Aktifkan"}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(ta)}
                    disabled={isAktif}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      isAktif
                        ? "Tidak bisa hapus TA yang sedang aktif"
                        : "Hapus TA"
                    }
                  >
                    <FiTrash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Tahun Ajaran"
        message={
          deleteTarget
            ? `Yakin ingin menghapus ${deleteTarget.label}? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Assign modal */}
      {showAssign && (
        <AssignUnassignedModal
          type={showAssign}
          tahunAjaranList={list}
          onClose={() => setShowAssign(null)}
          onSuccess={refresh}
        />
      )}

      {/* Suppress unused warning kalau aktif tidak dipakai */}
      <span className="hidden">{aktif?.id}</span>
    </div>
  );
}
