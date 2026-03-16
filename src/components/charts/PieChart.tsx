import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip, 
} from "recharts";

const data = [
  { name: "Ceramah", value: 52.1, color: "#A44A4A" },
  { name: "Tanya Jawab", value: 22.8, color: "#000000" },
  { name: "Diskusi", value: 13.9, color: "#E6C7C7" },
  { name: "Tidak ada Pembelajaran", value: 11.2, color: "#6B7280" },
];

export default function ChartPie() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">
          Aktivitas Pembelajaran
        </h2>

        <div className="flex gap-3 text-sm text-gray-500">
          <select className="bg-transparent outline-none">
            <option>RER</option>
          </select>
          <select className="bg-transparent outline-none">
            <option>TK-46-06</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex items-center">
        {/* CHART */}
        <div className="w-1/2 h-56">
          <ResponsiveContainer>
            <PieChart>

              {/* 🔥 TOOLTIP (hover muncul info) */}
              <Tooltip
                formatter={(value?: number) => `${value ?? 0}%`}
              />

              <Pie
                data={data}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"

                /* 🔥 ANIMASI */
                isAnimationActive={true}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LEGEND */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>

                <span className="text-gray-600 text-sm">
                  {item.name}
                </span>
              </div>

              <span className="text-gray-700 text-sm font-medium">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}