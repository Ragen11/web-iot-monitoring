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

type Props = {
  onDetailClick: () => void;
};

export default function ChartPie({
  onDetailClick,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">

        <h2 className="text-lg font-semibold text-gray-800">
          Aktivitas Pembelajaran
        </h2>

        {/* RANGE */}
        <div className="flex gap-2 bg-gray-100 rounded-lg px-2 py-1 text-xs">
          <span className="bg-white px-2 py-1 rounded-md shadow text-black font-medium">
            1H
          </span>

          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:text-black transition">
            1M
          </span>

          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:text-black transition">
            1B
          </span>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-3 text-sm text-gray-500 mb-6">

        <select className="bg-transparent outline-none cursor-pointer">
          <option>RER</option>
        </select>

        <select className="bg-transparent outline-none cursor-pointer">
          <option>TK-46-06</option>
        </select>
      </div>

      {/* CONTENT */}
      <div className="flex items-center justify-between">

        {/* CHART */}
        <div className="w-44 h-44 shrink-0">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
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
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span className="text-gray-700">
                  {item.name}
                </span>
              </div>

              {/* VALUE */}
              <span className="text-gray-900 font-medium">
                {item.value}%
              </span>
            </div>
          ))}

          {/* BUTTON */}
          <div className="flex justify-end pt-2">

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
      </div>
    </div>
  );
}