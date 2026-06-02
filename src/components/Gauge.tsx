import { useEffect, useState } from "react";
import axios from "axios";
import FilterDropdown, { type FilterOption } from "./FilterDropdown";
import RangeToggle, { type Range } from "./RangeToggle";

type Props = {
  onDetailClick: () => void;
};

type OptionItem = { kode: string; nama: string };

const RANGE_MAP: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "6M": 180 };

export default function Gauge({
  onDetailClick,
}: Props) {

  const [targetValue, setTargetValue] = useState(0);
  const [value, setValue]             = useState(0);
  const [loading, setLoading]         = useState(true);

  // FILTERS
  const [range,       setRange]       = useState<Range>("6M");
  const [filterDosen, setFilterDosen] = useState<string>("");
  const [filterKelas, setFilterKelas] = useState<string>("");

  // OPTIONS
  const [dosenOpts, setDosenOpts] = useState<OptionItem[]>([]);
  const [kelasOpts, setKelasOpts] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // CASCADING FILTER — dosen options menyesuaikan dengan kelas yang dipilih
  // (kirim hanya kelas, agar daftar dosen tetap luas dan tidak self-restrict)
  useEffect(() => {
    const params: any = {};
    if (filterKelas) params.kelas = filterKelas;

    axios
      .get(`${API_URL}/kehadiran/options`, { params })
      .then(res => setDosenOpts(res.data?.dosen ?? []))
      .catch(err => console.error("❌ gauge dosen options error:", err));
  }, [API_URL, filterKelas]);

  // CASCADING FILTER — kelas options menyesuaikan dengan dosen yang dipilih
  useEffect(() => {
    const params: any = {};
    if (filterDosen) params.dosen = filterDosen;

    axios
      .get(`${API_URL}/kehadiran/options`, { params })
      .then(res => setKelasOpts(res.data?.kelas ?? []))
      .catch(err => console.error("❌ gauge kelas options error:", err));
  }, [API_URL, filterDosen]);

  // FETCH SUMMARY tiap filter berubah
  useEffect(() => {

    const fetchSummary = async () => {
      try {
        setLoading(true);

        const params: any = { range_days: RANGE_MAP[range] ?? 30 };
        if (filterDosen) params.dosen = filterDosen;
        if (filterKelas) params.kelas = filterKelas;

        const res = await axios.get(`${API_URL}/kehadiran/summary`, { params });
        setTargetValue(res.data?.gauge_value ?? 0);
      } catch (err) {
        console.error("❌ Gagal fetch kehadiran/summary:", err);
        setTargetValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

  }, [API_URL, range, filterDosen, filterKelas]);

  // SMOOTH ANIMATION
  useEffect(() => {

    let start = value;
    const target = targetValue;

    if (start === target) return;

    const duration = 800;
    const stepTime = 10;
    const steps    = duration / stepTime;
    const increment = (target - start) / steps;

    const interval = setInterval(() => {

      start += increment;

      if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
        start = target;
        clearInterval(interval);
      }

      setValue(Math.round(start));

    }, stepTime);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  // GAUGE CONFIG
  const arcRadius     = 90;
  const stroke        = 20;
  const circumference = Math.PI * arcRadius;
  const progress      = (value / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <h2 className="text-gray-800 font-semibold text-lg">
          Kehadiran Dosen
        </h2>

        <RangeToggle size="sm" value={range} onChange={setRange} />
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        <FilterDropdown
          size="sm"
          width="w-36"
          label="Semua Dosen"
          value={filterDosen}
          onChange={setFilterDosen}
          options={dosenOpts.map<FilterOption>((d) => ({
            value: d.kode,
            label: d.nama || d.kode,
          }))}
        />

        <FilterDropdown
          size="sm"
          width="w-32"
          label="Semua Kelas"
          value={filterKelas}
          onChange={setFilterKelas}
          options={kelasOpts.map<FilterOption>((k) => ({ value: k, label: k }))}
        />
      </div>

      {/* GAUGE */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* SVG + VALUE wrapper (relative supaya angka ikut SVG) */}
        <div className="relative">
          <svg height={120} width={200}>

            {/* BACKGROUND */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={stroke}
              strokeLinecap="round"
            />

            {/* PROGRESS */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="#9F4A4A"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{
                transition: "stroke-dashoffset 0.3s ease-out",
              }}
            />
          </svg>

          {/* VALUE — pas di tengah arc */}
          <div className="absolute top-14 left-0 right-0 flex justify-center text-4xl font-bold text-gray-700">
            {loading ? "…" : `${value}%`}
          </div>
        </div>

        {/* LABEL — pas di bawah kaki arc (x=10 dan x=190) */}
        <div className="relative w-[200px] h-5 mt-1 text-sm text-gray-500">
          <span className="absolute left-[10px] -translate-x-1/2">0%</span>
          <span className="absolute left-[190px] -translate-x-1/2">100%</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end pr-2 mt-auto pt-4">
        <button
          onClick={onDetailClick}
          className="
            text-primary-deep
            text-sm
            font-semibold
            cursor-pointer
            hover:underline
            transition
          "
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}
