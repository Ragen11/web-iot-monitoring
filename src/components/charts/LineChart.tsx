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
import { useTahunAjaran } from "../../context/TahunAjaranContext";

type TrendRow = {
  name: string;
  ceramah: number;
  diskusi: number;
  tidakAda: number;
};

const LEGENDS = [
  { key: "ceramah",  label: "Ceramah",                color: "#f87171" },
  { key: "diskusi",  label: "Diskusi & Tanya Jawab",  color: "#60a5fa" },
  { key: "tidakAda", label: "Tidak ada pembelajaran", color: "#94a3b8" },
];

export default function ChartLine() {
  const [months,        setMonths]        = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [data,          setData]          = useState<TrendRow[]>([]);
  const [loading,       setLoading]       = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  // FETCH MONTHS (per TA)
  useEffect(() => {
    const params: any = {};
    if (taId) params.tahun_ajaran_id = taId;
    axios
      .get(`${API_URL}/aktivitas/months`, { params })
      .then((res) => {
        const list: string[] = res.data || [];
        setMonths(list);
        if (list.length > 0) setSelectedMonth(list[0]);
        else {
          setSelectedMonth("");
          setData([]);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ months error:", err);
        setLoading(false);
      });
  }, [API_URL, taId]);

  // FETCH TREND tiap bulan / TA berubah
  useEffect(() => {
    if (!selectedMonth) return;

    setLoading(true);
    const params: any = { month: selectedMonth };
    if (taId) params.tahun_ajaran_id = taId;
    axios
      .get(`${API_URL}/aktivitas/trend`, { params })
      .then((res) => {
        // Gabung Tanya Jawab + Diskusi → satu kategori "Diskusi & Tanya Jawab"
        const days: TrendRow[] = (res.data?.days || []).map((d: any) => ({
          name:     d.name,
          ceramah:  d.ceramah ?? 0,
          diskusi:  (d.diskusi ?? 0) + (d.tanyaJawab ?? 0),
          tidakAda: d.tidakAda ?? 0,
        }));
        setData(days);
      })
      .catch((err) => console.error("❌ trend error:", err))
      .finally(() => setLoading(false));
  }, [API_URL, selectedMonth, taId]);

  const monthOpts: FilterOption[] = months.map((m) => ({ value: m, label: m }));
  const hasData = data.some((d) => d.ceramah + d.diskusi + d.tidakAda > 0);

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
              formatter={(value: number | string | undefined) =>
                value !== undefined ? `${value}%` : ""
              }
            />

            <Line type="natural" dataKey="ceramah"  name="Ceramah"                 stroke="#f87171" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="natural" dataKey="diskusi"  name="Diskusi & Tanya Jawab"   stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="natural" dataKey="tidakAda" name="Tidak ada pembelajaran"  stroke="#94a3b8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
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
