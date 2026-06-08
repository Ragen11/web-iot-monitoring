import { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiBookOpen } from "react-icons/fi";
import { useTahunAjaran } from "../context/TahunAjaranContext";
import { calculateMingguKe } from "../lib/semester";

type Anomali = {
  report_id: number;
  tanggal: string;
  jam?: string;
  ruangan?: string;
  kode_matkul: string;
  matkul: string;
  kelas: string;
  kode_dosen: string;
  jenis: string[];               // ["Durasi Kurang", "Materi Tidak Sesuai"]
  durasi_aktual: number | null;
  durasi_rps: number | null;
  kesesuaian_materi: string | null;
  status_waktu: string | null;
};

export default function AnomaliTable() {
  const [data, setData]       = useState<Anomali[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  useEffect(() => {
    const fetchAnomali = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (taId) params.tahun_ajaran_id = taId;
        const res = await axios.get(`${API_URL}/dashboard/anomali`, { params });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Fetch anomali error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomali();
  }, [API_URL, taId]);

  const hasDurasi         = (a: Anomali) => a.jenis.includes("Durasi Kurang");
  const hasMateri         = (a: Anomali) => a.jenis.includes("Materi Tidak Sesuai");
  const hasMateriSebagian = (a: Anomali) => a.jenis.includes("Materi Sebagian Sesuai");

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700">Deteksi Anomali</h2>
        </div>
        {!loading && data.length > 0 && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {data.length}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Pertemuan tidak sesuai RPS (durasi / materi)
      </p>

      {/* States */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FiCheckCircle className="text-green-400 mb-2" size={28} />
          <p className="text-sm text-gray-500">Tidak ada anomali terdeteksi</p>
          <p className="text-xs text-gray-400">Semua pertemuan sesuai RPS</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto -mx-1 px-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left font-medium pb-2">Kelas / Matkul</th>
                <th className="text-right font-medium pb-2">Anomali</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.report_id} className="border-b border-gray-50 last:border-0">
                  {/* Matkul + meta */}
                  <td className="py-2 pr-2 align-top">
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const minggu = calculateMingguKe(a.tanggal);
                        return minggu !== null ? (
                          <span
                            className="shrink-0 text-[10px] font-semibold text-primary bg-[#fdf0f0] px-1.5 py-0.5 rounded"
                            title={`Minggu ke-${minggu}`}
                          >
                            M{minggu}
                          </span>
                        ) : null;
                      })()}
                      <p className="font-medium text-gray-800 leading-tight truncate max-w-[130px]" title={a.matkul}>
                        {a.matkul}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.tanggal} · {a.kelas}
                    </p>
                  </td>

                  {/* Badges anomali */}
                  <td className="py-2 align-top">
                    <div className="flex flex-col items-end gap-1">
                      {hasDurasi(a) && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
                          title={`Durasi aktual ${a.durasi_aktual} menit, seharusnya ${a.durasi_rps} menit sesuai RPS`}
                        >
                          <FiClock size={11} />
                          {a.durasi_aktual}/{a.durasi_rps}m
                        </span>
                      )}
                      {hasMateri(a) && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700"
                          title={`Kesesuaian materi: ${a.kesesuaian_materi}`}
                        >
                          <FiBookOpen size={11} />
                          Materi
                        </span>
                      )}
                      {hasMateriSebagian(a) && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600"
                          title={`Kesesuaian materi: ${a.kesesuaian_materi}`}
                        >
                          <FiBookOpen size={11} />
                          Sebagian
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
