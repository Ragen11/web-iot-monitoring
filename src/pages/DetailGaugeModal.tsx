import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { X } from "lucide-react";
import axios from "axios";
import FilterDropdown, { type FilterOption } from "../components/FilterDropdown";
import RangeToggle, { type Range } from "../components/RangeToggle";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Summary = {
  gauge_value: number;
  tepat_waktu_pct: number;
  terlambat_pct: number;
  tidak_hadir_pct: number;
  total_pertemuan: number;
};

type TrendItem = {
  day: string;
  value: number;
  date?: string;
  total?: number;
};

type RankingItem = {
  id: number;
  name: string;
  attendance: number;
  status: string;
  kode_dosen?: string;
};

type AttendanceItem = {
  matkul: string;
  dosen: string;
  hadir: number;
  terlambat: number;
  tidakHadir: number;
  kelas?: string;
};

type OptionItem = { kode: string; nama: string };

type DashboardResp = {
  summary: Summary;
  trend: TrendItem[];
  ranking: RankingItem[];
  per_matkul: AttendanceItem[];
};

const RANGE_MAP: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "6M": 180 };

// untuk LineChart "Tren Kehadiran" — berapa titik data yg ditampilkan
const TREND_DAYS_MAP: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "6M": 30 };

function GaugeChart({ value }: { value: number }) {
  // arcRadius HARUS sama dengan radius pada SVG path "A 110 110 ..."
  const arcRadius     = 110;
  const stroke        = 26;
  const circumference = Math.PI * arcRadius;
  const progress      = (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={160} width={260}>
        {/* BG */}
        <path
          d="M 20 130 A 110 110 0 0 1 240 130"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* PROGRESS */}
        <path
          d="M 20 130 A 110 110 0 0 1 240 130"
          fill="none"
          stroke="#9F4A4A"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s ease",
          }}
        />
      </svg>

      <div className="absolute top-16 flex flex-col items-center">
        <h1 className="text-5xl font-bold text-gray-800">
          {Math.round(value)}%
        </h1>

        <p className="text-gray-500 mt-1">
          Kehadiran Dosen
        </p>
      </div>
    </div>
  );
}

function KPIBox({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <p className="text-sm text-gray-500 mb-2">
        {title}
      </p>

      <h2
        className="text-3xl font-bold"
        style={{ color }}
      >
        {value}
      </h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyle = {
    "Sangat Baik": "bg-green-100 text-green-700",
    "Baik": "bg-blue-100 text-blue-700",
    "Cukup": "bg-yellow-100 text-yellow-700",
    "Warning": "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        statusStyle[status as keyof typeof statusStyle] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function DetailGaugeModal({
  open,
  onClose,
}: Props) {

  const scrollRef  = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [thumbH,       setThumbH]       = useState(0);
  const [thumbTop,     setThumbTop]     = useState(0);
  const [thumbVisible, setThumbVisible] = useState(false);

  // ── DATA STATE ──
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [trend,      setTrend]      = useState<TrendItem[]>([]);
  const [ranking,    setRanking]    = useState<RankingItem[]>([]);
  const [perMatkul,  setPerMatkul]  = useState<AttendanceItem[]>([]);
  const [loading,    setLoading]    = useState(false);

  // ── FILTERS ──
  const [range,        setRange]        = useState<Range>("6M");
  const [filterDosen,  setFilterDosen]  = useState<string>("");
  const [filterKelas,  setFilterKelas]  = useState<string>("");
  const [dosenOpts,    setDosenOpts]    = useState<OptionItem[]>([]);
  const [kelasOpts,    setKelasOpts]    = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  /* ── ESC key ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── FETCH OPTIONS (sekali saja saat modal pertama buka) ── */
  useEffect(() => {
    if (!open || dosenOpts.length > 0) return;

    axios.get(`${API_URL}/kehadiran/options`)
      .then(res => {
        setDosenOpts(res.data?.dosen ?? []);
        setKelasOpts(res.data?.kelas ?? []);
      })
      .catch(err => console.error("❌ options error:", err));
  }, [open, API_URL, dosenOpts.length]);

  /* ── FETCH DASHBOARD setiap filter berubah ── */
  useEffect(() => {
    if (!open) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const params: any = {
          range_days: RANGE_MAP[range] ?? 30,
          trend_days: TREND_DAYS_MAP[range] ?? 30,
        };
        if (filterDosen) params.dosen = filterDosen;
        if (filterKelas) params.kelas = filterKelas;

        const res = await axios.get<DashboardResp>(`${API_URL}/kehadiran/dashboard`, { params });

        setSummary(res.data.summary);
        setTrend(res.data.trend);
        setRanking(res.data.ranking);
        setPerMatkul(res.data.per_matkul);

      } catch (err) {
        console.error("❌ dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [open, range, filterDosen, filterKelas, API_URL]);

  /* ── Hitung posisi thumb ── */
  const calcThumb = () => {
    const el = scrollRef.current;
    if (!el) return;
    const ratio   = el.clientHeight / el.scrollHeight;
    setThumbH(Math.max(el.clientHeight * ratio, 40));
    setThumbTop(el.scrollTop * ratio);
  };

  const startHide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setThumbVisible(false), 900);
  };

  const showBar = () => {
    calcThumb();
    setThumbVisible(true);
    startHide();
  };

  /* ── Pasang listener saat modal terbuka ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !open) return;

    calcThumb();
    el.scrollTop = 0;

    const onScroll     = () => showBar();
    const onEnter      = () => showBar();
    const onLeave      = () => startHide();

    el.addEventListener("scroll",     onScroll, { passive: true });
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("scroll",     onScroll);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, summary, trend, ranking, perMatkul]);

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
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
          >
            <div
              className="bg-white w-full max-w-7xl rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X size={22} />
              </button>

              <div
                ref={scrollRef}
                className="max-h-[95vh] sm:max-h-[92vh] overflow-y-scroll p-4 sm:p-8 scrollbar-none"
              >

              {/* HEADER */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-10 pr-10 sm:pr-12">

                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                    Kehadiran Dosen
                  </h1>

                  <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                    Monitoring dan analisis performa kehadiran dosen
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
                      label: d.nama || d.kode,
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

              {/* TOP SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center mb-8 sm:mb-12">

                <div className="flex justify-center">
                  <GaugeChart value={summary?.gauge_value ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  <KPIBox
                    title="Tepat Waktu"
                    value={`${summary?.tepat_waktu_pct ?? 0}%`}
                    color="#16A34A"
                  />

                  <KPIBox
                    title="Terlambat"
                    value={`${summary?.terlambat_pct ?? 0}%`}
                    color="#D97706"
                  />

                  <KPIBox
                    title="Tidak Hadir"
                    value={`${summary?.tidak_hadir_pct ?? 0}%`}
                    color="#DC2626"
                  />

                  <KPIBox
                    title="Total Pertemuan"
                    value={`${summary?.total_pertemuan ?? 0}`}
                    color="#111827"
                  />
                </div>
              </div>

              {/* TREND CHART */}
              <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Tren Kehadiran
                  </h2>

                  <p className="text-gray-500 mt-1">
                    Persentase kehadiran dosen pada periode terpilih
                  </p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#9F4A4A"
                        strokeWidth={4}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RANKING */}
              <div className="mb-10">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Ranking Kehadiran Dosen
                  </h2>

                  <p className="text-gray-500 mt-1">
                    Performa kehadiran dosen berdasarkan persentase kehadiran
                  </p>
                </div>

                {ranking.length === 0 ? (
                  <p className="text-gray-400 text-sm">Belum ada data kehadiran.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                    {ranking.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {item.name || item.kode_dosen}
                          </h3>

                          <p className="text-gray-500 text-sm mt-1">
                            Kehadiran {item.attendance}%
                          </p>
                        </div>

                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TABLE */}
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Detail Kehadiran
                  </h2>

                  <p className="text-gray-500 mt-1">
                    Detail statistik kehadiran dosen per mata kuliah
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm">
                        <th className="pb-3">Mata Kuliah</th>
                        <th className="pb-3">Dosen</th>
                        <th className="pb-3">Hadir</th>
                        <th className="pb-3">Terlambat</th>
                        <th className="pb-3">Tidak Hadir</th>
                      </tr>
                    </thead>

                    <tbody>
                      {perMatkul.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-5 text-center text-gray-400 text-sm">
                            Belum ada data kehadiran per mata kuliah.
                          </td>
                        </tr>
                      ) : (
                        perMatkul.map((item, index) => (
                          <tr
                            key={index}
                            className="bg-gray-50 hover:bg-gray-100 transition"
                          >
                            <td className="p-5 rounded-l-2xl font-semibold text-gray-800">
                              {item.matkul}
                            </td>

                            <td className="p-5 text-gray-700">
                              {item.dosen}
                            </td>

                            <td className="p-5 text-green-600 font-semibold">
                              {item.hadir}%
                            </td>

                            <td className="p-5 text-yellow-600 font-semibold">
                              {item.terlambat}%
                            </td>

                            <td className="p-5 rounded-r-2xl text-red-600 font-semibold">
                              {item.tidakHadir}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>{/* end scrollable inner */}

              {/* Custom scrollbar thumb */}
              <div className="absolute right-1.5 top-0 bottom-0 w-[5px] pointer-events-none rounded-full">
                <div
                  className="absolute w-full rounded-full bg-gray-400"
                  style={{
                    height: thumbH,
                    top:    thumbTop,
                    opacity:    thumbVisible ? 0.55 : 0,
                    transition: "opacity 0.35s ease",
                  }}
                />
              </div>

            </div>{/* end outer card */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
