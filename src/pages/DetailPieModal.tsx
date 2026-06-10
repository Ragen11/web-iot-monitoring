import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { X } from "lucide-react";
import axios from "axios";
import FilterDropdown, { type FilterOption } from "../components/FilterDropdown";
import RangeToggle, { type Range } from "../components/RangeToggle";
import { useTahunAjaran } from "../context/TahunAjaranContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Summary = {
  ceramah_pct: number;
  tanya_jawab_pct: number;
  diskusi_pct: number;
  diam_pct: number;
  total_pertemuan: number;
};

type MatkulItem = {
  matkul: string;
  kode_matkul: string;
  kelas?: string;
  dosen?: string;
  ceramah: number;
  tanya: number;
  diskusi: number;
  tidakAda: number;
  total_pertemuan: number;
};

type OptionItem = { kode: string; nama: string };

const RANGE_MAP: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "6M": 180 };

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 min-w-[150px]">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span className="text-sm text-gray-700 w-10 text-right">
        {value}%
      </span>
    </div>
  );
}

export default function DetailPieModal({ open, onClose }: Props) {

  const [summary, setSummary]       = useState<Summary | null>(null);
  const [perMatkul, setPerMatkul]   = useState<MatkulItem[]>([]);
  const [loading, setLoading]       = useState(false);

  // FILTERS
  const [range,       setRange]       = useState<Range>("6M");
  const [filterDosen, setFilterDosen] = useState<string>("");
  const [filterKelas, setFilterKelas] = useState<string>("");

  // OPTIONS
  const [dosenOpts, setDosenOpts] = useState<OptionItem[]>([]);
  const [kelasOpts, setKelasOpts] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  // ESC close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // FETCH OPTIONS — refetch saat TA berubah
  useEffect(() => {
    if (!open) return;

    const params: any = {};
    if (taId) params.tahun_ajaran_id = taId;

    axios.get(`${API_URL}/aktivitas/options`, { params })
      .then(res => {
        setDosenOpts(res.data?.dosen ?? []);
        setKelasOpts(res.data?.kelas ?? []);
      })
      .catch(err => console.error("❌ options error:", err));
  }, [open, API_URL, taId]);

  // FETCH DASHBOARD setiap filter berubah
  useEffect(() => {
    if (!open) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const params: any = { range_days: RANGE_MAP[range] ?? 30 };
        if (filterDosen) params.dosen = filterDosen;
        if (filterKelas) params.kelas = filterKelas;
        if (taId)        params.tahun_ajaran_id = taId;

        const res = await axios.get(`${API_URL}/aktivitas/dashboard`, { params });
        setSummary(res.data?.summary ?? null);
        setPerMatkul(res.data?.per_matkul ?? []);
      } catch (err) {
        console.error("❌ aktivitas dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [open, range, filterDosen, filterKelas, taId, API_URL]);

  const summaryData = [
    { name: "Ceramah",     value: summary?.ceramah_pct     ?? 0, color: "#9F4A4A" },
    { name: "Tanya Jawab", value: summary?.tanya_jawab_pct ?? 0, color: "#000000" },
    { name: "Diskusi",     value: summary?.diskusi_pct     ?? 0, color: "#E6C7C7" },
    { name: "Diam",   value: summary?.diam_pct        ?? 0, color: "#6B7280" },
  ];

  const hasData   = summaryData.some(d => d.value > 0);
  const chartData = summaryData.filter(d => d.value > 0); // buang 0% agar gap konsisten

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
          >
            <div
              className="bg-white w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >

              {/* CLOSE BUTTON */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X size={22} />
              </button>

              {/* HEADER */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-8 pr-10 sm:pr-12">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Aktivitas Pembelajaran
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">
                    Detail distribusi metode pembelajaran per mata kuliah
                    {loading && <span className="ml-2 text-xs text-gray-400">(memuat…)</span>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <FilterDropdown
                    width="w-44"
                    label="Semua Dosen"
                    value={filterDosen}
                    onChange={setFilterDosen}
                    options={dosenOpts.map<FilterOption>((d) => ({
                      value: d.kode,
                      label: d.kode,
                    }))}
                  />

                  <FilterDropdown
                    width="w-40"
                    label="Semua Kelas"
                    value={filterKelas}
                    onChange={setFilterKelas}
                    options={kelasOpts.map<FilterOption>((k) => ({ value: k, label: k }))}
                  />

                  <RangeToggle value={range} onChange={setRange} />
                </div>
              </div>

              {/* TOP SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8 sm:mb-10">

                {/* PIE */}
                <div className="flex justify-center">
                  <div className="w-56 h-56 sm:w-72 sm:h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={hasData ? chartData : [{ name: "kosong", value: 1, color: "#E5E7EB" }]}
                          dataKey="value"
                          innerRadius={70}
                          outerRadius={110}
                          stroke="none"
                          paddingAngle={hasData && chartData.length > 1 ? 2 : 0}
                        >
                          {(hasData ? chartData : [{ color: "#E5E7EB" }]).map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* LEGEND */}
                <div className="space-y-5">
                  {summaryData.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />

                        <span className="text-lg text-gray-800">
                          {item.name}
                        </span>
                      </div>

                      <span className="text-lg font-semibold text-gray-900">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="pb-3">Mata Kuliah</th>
                      <th className="pb-3">Ceramah</th>
                      <th className="pb-3">Tanya Jawab</th>
                      <th className="pb-3">Diskusi</th>
                      <th className="pb-3">Diam</th>
                    </tr>
                  </thead>

                  <tbody>
                    {perMatkul.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-5 text-center text-gray-400 text-sm">
                          Belum ada data aktivitas.
                        </td>
                      </tr>
                    ) : (
                      perMatkul.map((item, index) => (
                        <tr
                          key={index}
                          className="bg-gray-50 hover:bg-gray-100 transition rounded-2xl"
                        >
                          <td className="p-4 rounded-l-2xl font-semibold text-gray-800">
                            {item.matkul}
                          </td>

                          <td className="p-4">
                            <ProgressBar value={item.ceramah}  color="#9F4A4A" />
                          </td>

                          <td className="p-4">
                            <ProgressBar value={item.tanya}    color="#000000" />
                          </td>

                          <td className="p-4">
                            <ProgressBar value={item.diskusi}  color="#E6C7C7" />
                          </td>

                          <td className="p-4 rounded-r-2xl">
                            <ProgressBar value={item.tidakAda} color="#6B7280" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
