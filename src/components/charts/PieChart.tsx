import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import FilterDropdown, { type FilterOption } from "../FilterDropdown";
import RangeToggle, { type Range } from "../RangeToggle";

type Props = {
  onDetailClick: () => void;
};

type OptionItem = { kode: string; nama: string };

const RANGE_MAP: Record<Range, number> = { "1H": 1, "1M": 30, "1B": 90 };

const COLORS = {
  ceramah:     "#9F4A4A",
  tanya_jawab: "#000000",
  diskusi:     "#E6C7C7",
  diam:        "#6B7280",
};

export default function ChartPie({
  onDetailClick,
}: Props) {

  const [data, setData] = useState([
    { name: "Ceramah",                value: 0, color: COLORS.ceramah },
    { name: "Tanya Jawab",            value: 0, color: COLORS.tanya_jawab },
    { name: "Diskusi",                value: 0, color: COLORS.diskusi },
    { name: "Tidak ada Pembelajaran", value: 0, color: COLORS.diam },
  ]);

  const [loading, setLoading] = useState(true);

  // FILTERS
  const [range,       setRange]       = useState<Range>("1M");
  const [filterDosen, setFilterDosen] = useState<string>("");
  const [filterKelas, setFilterKelas] = useState<string>("");

  // OPTIONS
  const [dosenOpts, setDosenOpts] = useState<OptionItem[]>([]);
  const [kelasOpts, setKelasOpts] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // FETCH OPTIONS sekali
  useEffect(() => {
    axios.get(`${API_URL}/aktivitas/options`)
      .then(res => {
        setDosenOpts(res.data?.dosen ?? []);
        setKelasOpts(res.data?.kelas ?? []);
      })
      .catch(err => console.error("❌ pie options error:", err));
  }, [API_URL]);

  // FETCH SUMMARY
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);

        const params: any = { range_days: RANGE_MAP[range] ?? 30 };
        if (filterDosen) params.dosen = filterDosen;
        if (filterKelas) params.kelas = filterKelas;

        const res = await axios.get(`${API_URL}/aktivitas/summary`, { params });
        const d = res.data || {};

        setData([
          { name: "Ceramah",                value: d.ceramah_pct     ?? 0, color: COLORS.ceramah },
          { name: "Tanya Jawab",            value: d.tanya_jawab_pct ?? 0, color: COLORS.tanya_jawab },
          { name: "Diskusi",                value: d.diskusi_pct     ?? 0, color: COLORS.diskusi },
          { name: "Tidak ada Pembelajaran", value: d.diam_pct        ?? 0, color: COLORS.diam },
        ]);
      } catch (err) {
        console.error("❌ Gagal fetch aktivitas/summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [API_URL, range, filterDosen, filterKelas]);

  const hasData = data.some(d => d.value > 0);
  const chartData = data.filter(d => d.value > 0); // buang slice 0% agar paddingAngle konsisten

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">

        <h2 className="text-lg font-semibold text-gray-800">
          Aktivitas Pembelajaran
        </h2>

        <RangeToggle size="sm" value={range} onChange={setRange} />
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-6">
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

      {/* CONTENT */}
      <div className="flex items-center justify-between">

        {/* CHART */}
        <div className="w-44 h-44 shrink-0">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hasData ? chartData : [{ name: "kosong", value: 1, color: "#E5E7EB" }]}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
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

        {/* LEGEND */}
        <div className="flex-1 ml-6 space-y-4 text-sm">

          {data.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center"
            >

              {/* LEFT */}
              <div className="flex items-center gap-3">

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <span className="text-gray-700">
                  {item.name}
                </span>
              </div>

              {/* VALUE */}
              <span className="text-gray-900 font-medium">
                {loading ? "…" : `${item.value}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end pr-2 mt-auto pt-4">
        <button
          onClick={onDetailClick}
          className="
            text-[#9F4A4A]
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
