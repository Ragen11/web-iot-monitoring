import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FiChevronDown } from "react-icons/fi";

const dataByMonth: Record<string, { name: string; tinggi: number; normal: number; rata: number }[]> = {
  "Mei 2026": [
    { name: "SEN", tinggi: 45, rata: 70, normal: 65 },
    { name: "SEL", tinggi: 72, rata: 73, normal: 70 },
    { name: "RAB", tinggi: 60, rata: 72, normal: 52 },
    { name: "KAM", tinggi: 103, rata: 78, normal: 25 },
    { name: "JUM", tinggi: 100, rata: 82, normal: 78 },
    { name: "SAB", tinggi: 40, rata: 75, normal: 75 },
    { name: "MIN", tinggi: 80, rata: 60, normal: 78 },
  ],
  "Apr 2026": [
    { name: "SEN", tinggi: 55, rata: 65, normal: 60 },
    { name: "SEL", tinggi: 80, rata: 70, normal: 65 },
    { name: "RAB", tinggi: 70, rata: 68, normal: 55 },
    { name: "KAM", tinggi: 90, rata: 75, normal: 30 },
    { name: "JUM", tinggi: 85, rata: 78, normal: 70 },
    { name: "SAB", tinggi: 50, rata: 72, normal: 72 },
    { name: "MIN", tinggi: 65, rata: 58, normal: 68 },
  ],
};

const months = Object.keys(dataByMonth);

const renderLegend = () => (
  <div className="flex items-center gap-4 text-xs text-gray-500">
    <span className="flex items-center gap-1">
      <span className="inline-block w-6 h-0.5 bg-red-400 rounded" />
      Interaksi Tinggi
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-6 h-0.5 bg-blue-400 rounded" />
      Normal
    </span>
  </div>
);

export default function ChartLine() {
  const [selectedMonth, setSelectedMonth] = useState("Mei 2026");
  const [showDropdown, setShowDropdown] = useState(false);

  const data = dataByMonth[selectedMonth];

  return (
    <div className="bg-white p-5 rounded-xl shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-semibold text-gray-800">Tren Interaksi Pembelajaran</h2>
        </div>

        <div className="flex items-center gap-4">
          {renderLegend()}

          {/* Month Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {selectedMonth}
              <FiChevronDown className="text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(m); setShowDropdown(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition
                      ${m === selectedMonth ? "text-[#A44A4A] font-medium" : "text-gray-700"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            labelStyle={{ fontWeight: 600, color: "#374151" }}
          />
          <Legend content={() => null} />
          <Line
            type="natural"
            dataKey="tinggi"
            name="Interaksi Tinggi"
            stroke="#f87171"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="natural"
            dataKey="rata"
            name="Rata-rata"
            stroke="#34d399"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="natural"
            dataKey="normal"
            name="Normal"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
