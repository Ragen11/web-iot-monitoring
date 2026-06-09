import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiTrash2 } from "react-icons/fi";
import { useTahunAjaran, type TahunAjaran } from "../context/TahunAjaranContext";
import ConfirmDialog from "../components/ConfirmDialog";

const API_URL = import.meta.env.VITE_API_URL;

export default function TahunAjaranPage() {
  const { list, aktif, loading, refresh } = useTahunAjaran();

  // Aksi per row
  const [deleteTarget, setDeleteTarget] = useState<TahunAjaran | null>(null);

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
      <div>
        <h1 className="text-xl font-semibold">Tahun Ajaran</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Tahun ajaran berjalan otomatis. Yang{" "}
          <span className="font-medium text-green-600">AKTIF</span> ditentukan
          dari bulan berjalan — Genap: Feb–Jul · Ganjil: Agu–Jan.
        </p>
      </div>

      {/* LIST TAHUN AJARAN */}
      <div className="space-y-3">
        {loading && list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 text-sm">
            Memuat daftar tahun ajaran...
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 text-sm">
            Belum ada tahun ajaran. Tahun ajaran aktif akan dibuat otomatis.
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
                    <h3 className="font-semibold text-gray-800">{ta.label}</h3>
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

      {/* Suppress unused warning kalau aktif tidak dipakai */}
      <span className="hidden">{aktif?.id}</span>
    </div>
  );
}
