import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Ceramah", value: 52.1, color: "#9F4A4A" },
  { name: "Tanya Jawab", value: 22.8, color: "#000000" },
  { name: "Diskusi", value: 13.9, color: "#E6C7C7" },
  { name: "Tidak ada Pembelajaran", value: 11.2, color: "#6B7280" },
];

export default function ChartPie() {
  return (
    <div className="bg-[#F9FAFB] p-6 rounded-3xl shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Aktivitas Pembelajaran
        </h2>

        <div className="flex gap-2 bg-gray-100 rounded-lg px-2 py-1 text-xs">
          <span className="bg-white px-2 py-1 rounded-md shadow text-black">
            1H
          </span>
          <span className="px-2 py-1 text-gray-500">1M</span>
          <span className="px-2 py-1 text-gray-500">1B</span>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-3 text-sm text-gray-500 mb-4">
        <select className="bg-transparent outline-none">
          <option>RER</option>
        </select>
        <select className="bg-transparent outline-none">
          <option>TK-46-06</option>
        </select>
      </div>

      {/* CONTENT */}
      <div className="flex items-center justify-between">

        {/* CHART */}
        <div className="w-44 h-44">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LEGEND */}
        <div className="flex-1 ml-6 space-y-3 text-sm">
          {data.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.name}</span>
              </div>

              <span className="text-gray-800">
                {item.value}%
              </span>
            </div>
          ))}

          <div className="text-right mt-4">
            <button className="text-[#9F4A4A] text-sm font-medium cursor-pointer hover:underline">
              Lihat Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}