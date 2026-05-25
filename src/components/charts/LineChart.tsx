import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import FilterDropdown, { type FilterOption } from "../FilterDropdown";

type TrendRow = {
  name: string;
  ceramah: number;
  tanyaJawab: number;
  diskusi: number;
  tidakAda: number;
};

const LEGENDS = [
  { key: "ceramah",    label: "Ceramah",               color: "#f87171" },
  { key: "tanyaJawab", label: "Tanya Jawab",           color: "#34d399" },
  { key: "diskusi",    label: "Diskusi",               color: "#60a5fa" },
  { key: "tidakAda",   label: "Tidak ada pembelajaran", color: "#94a3b8" },
];

export default function ChartLine() {
  const [months,        setMonths]        = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [data,          setData]          = useState<TrendRow[]>([]);
  const [loading,       setLoading]       = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // FETCH MONTHS (sekali)
  useEffect(() => {
    axios
      .get(`${API_URL}/aktivitas/months`)
      .then((res) => {
        const list: string[] = res.data || [];
        setMonths(list);
        if (list.length > 0) setSelectedMonth(list[0]);
        else setLoading(false);
      })
      .catch((err) => {
        console.error("❌ months error:", err);
        setLoading(false);
      });
  }, [API_URL]);

  // FETCH TREND tiap bulan berubah
  useEffect(() => {
    if (!selectedMonth) return;

    setLoading(true);
    axios
      .get(`${API_URL}/aktivitas/trend`, { params: { month: selectedMonth } })
      .then((res) => setData(res.data?.days || []))
      .catch((err) => console.error("❌ trend error:", err))
      .finally(() => setLoading(false));
  }, [API_URL, selectedMonth]);

  const monthOpts: FilterOption[] = months.map((m) => ({ value: m, label: m }));
  const hasData = data.some((d) => d.ceramah + d.tanyaJawab + d.diskusi + d.tidakAda > 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">

        {/* Judul */}
        <div>
          <h2 className="font-semibold text-gray-800">
            Tren Aktivitas Pembelajaran
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Perbandingan aktivitas kelas per hari
            {loading && <span className="ml-2 text-gray-300">(memuat…)</span>}
          </p>
        </div>

        {/* Kontrol kanan */}
        <div className="flex items-center gap-4 flex-wrap">

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {LEGENDS.map((l) => (
              <span key={l.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span
                  className="inline-block w-5 h-0.5 rounded"
                  style={{ backgroundColor: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>

          {/* Dropdown bulan */}
          {months.length > 0 ? (
            <FilterDropdown
              size="sm"
              width="w-32"
              label="Bulan"
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v)}
              options={monthOpts}
              showReset={false}
            />
          ) : (
            <span className="text-xs text-gray-400 italic">Belum ada data</span>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 15, right: 20, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}
              formatter={(value: number) => `${value}%`}
            />

            <Line type="natural" dataKey="ceramah"    name="Ceramah"                stroke="#f87171" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="natural" dataKey="tanyaJawab" name="Tanya Jawab"            stroke="#34d399" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="natural" dataKey="diskusi"    name="Diskusi"                stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="natural" dataKey="tidakAda"   name="Tidak ada pembelajaran" stroke="#94a3b8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
          {loading ? "Memuat data…" : "Belum ada data aktivitas untuk bulan ini."}
        </div>
      )}
    </div>
  );
}
