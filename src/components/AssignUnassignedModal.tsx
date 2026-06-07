import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import type { TahunAjaran } from "../context/TahunAjaranContext";

const API_URL = import.meta.env.VITE_API_URL;

type JadwalRow = {
  id: string;
  kode_mata_kuliah?: string;
  mata_kuliah?: string;
  kelas?: string;
  dosen_utama?: string;
  hari?: string;
  jam_mulai?: string;
  ruangan?: string;
};

type RpsRow = {
  id: string;
  kode_matkul?: string;
  pertemuan_ke?: number;
  materi_pembelajaran?: string;
};

type Props = {
  type: "jadwal" | "rps";
  tahunAjaranList: TahunAjaran[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignUnassignedModal({
  type,
  tahunAjaranList,
  onClose,
  onSuccess,
}: Props) {
  const [items, setItems]       = useState<(JadwalRow | RpsRow)[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [taId, setTaId]         = useState<string>("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const title =
    type === "jadwal" ? "Assign Jadwal ke Tahun Ajaran" : "Assign RPS ke Tahun Ajaran";

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch unassigned data
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const url = `${API_URL}/tahun-ajaran/unassigned/${type}`;
        const res = await axios.get(url);
        setItems(res.data?.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [type]);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const handleSubmit = async () => {
    if (!taId) {
      toast.error("Pilih tahun ajaran terlebih dahulu");
      return;
    }
    if (selected.size === 0) {
      toast.error("Pilih minimal 1 data");
      return;
    }

    const endpoint =
      type === "jadwal"
        ? `${API_URL}/tahun-ajaran/assign-jadwal`
        : `${API_URL}/tahun-ajaran/assign-rps`;

    const payload = {
      tahun_ajaran_id: taId,
      ids: Array.from(selected),
    };

    try {
      setSaving(true);
      console.log("[ASSIGN] POST", endpoint, payload);

      const res = await axios.post(endpoint, payload);
      console.log("[ASSIGN] response", res.data);

      const affected = res.data?.affected ?? selected.size;
      toast.success(
        res.data?.message || `${affected} data berhasil di-assign`
      );

      // Update state SEBELUM unmount agar tidak React warning
      setSaving(false);

      // Defer parent updates ke microtask berikutnya — beri waktu React
      // selesai render saat ini sebelum modal di-unmount
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 0);
    } catch (err: any) {
      console.error("[ASSIGN] error", err);

      // Parse error message defensif (Pydantic kadang return array)
      let errMsg = "Gagal assign data";
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        errMsg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        errMsg = detail[0].msg;
      } else if (err?.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
      setSaving(false);
    }
  };

  const renderRow = (item: JadwalRow | RpsRow) => {
    if (type === "jadwal") {
      const j = item as JadwalRow;
      return (
        <div className="text-sm">
          <p className="font-medium text-gray-700">
            {j.kode_mata_kuliah} — {j.mata_kuliah || "-"}
          </p>
          <p className="text-xs text-gray-400">
            {j.kelas} · {j.dosen_utama} · {j.hari} {j.jam_mulai?.slice(0, 5)} ·{" "}
            {j.ruangan}
          </p>
        </div>
      );
    }
    const r = item as RpsRow;
    return (
      <div className="text-sm">
        <p className="font-medium text-gray-700">
          {r.kode_matkul} — Pertemuan {r.pertemuan_ke}
        </p>
        <p className="text-xs text-gray-400 line-clamp-1">
          {r.materi_pembelajaran || "-"}
        </p>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Pilih TA target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Ajaran Target
                </label>
                <select
                  value={taId}
                  onChange={(e) => setTaId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
                >
                  <option value="">— Pilih Tahun Ajaran —</option>
                  {tahunAjaranList.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.label}
                      {ta.is_aktif ? " (Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* List unassigned */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Data Belum Di-assign ({items.length})
                  </label>
                  {items.length > 0 && (
                    <button
                      onClick={toggleAll}
                      className="text-xs text-primary hover:underline"
                    >
                      {selected.size === items.length
                        ? "Batal semua"
                        : "Pilih semua"}
                    </button>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-gray-400 text-center py-10">
                      Memuat...
                    </p>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">
                      Semua data sudah di-assign ke tahun ajaran 🎉
                    </p>
                  ) : (
                    items.map((item) => {
                      const checked = selected.has(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition ${
                            checked ? "bg-primary/5" : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(item.id)}
                            className="mt-0.5 accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            {renderRow(item)}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-100 gap-3">
              <p className="text-xs text-gray-500">
                {selected.size} dari {items.length} dipilih
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !taId || selected.size === 0}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Menyimpan..." : `Assign ${selected.size} data`}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
    </>
  );
}
