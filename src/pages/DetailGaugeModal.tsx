import { useEffect } from "react";
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

const trendData = [
  { day: "Sen", value: 90 },
  { day: "Sel", value: 82 },
  { day: "Rab", value: 96 },
  { day: "Kam", value: 88 },
  { day: "Jum", value: 99 },
  { day: "Sab", value: 75 },
  { day: "Min", value: 80 },
];

const rankingData = [
  {
    name: "Dr. Andi Wijaya",
    attendance: 99,
    status: "Sangat Baik",
  },
  {
    name: "Dr. Budi Santoso",
    attendance: 95,
    status: "Baik",
  },
  {
    name: "Dr. Citra Lestari",
    attendance: 87,
    status: "Cukup",
  },
  {
    name: "Dr. Dimas Pratama",
    attendance: 68,
    status: "Warning",
  },
];

const attendanceTable = [
  {
    matkul: "Kalkulus",
    dosen: "Dr. Andi Wijaya",
    hadir: 96,
    terlambat: 3,
    tidakHadir: 1,
  },
  {
    matkul: "Machine Learning",
    dosen: "Dr. Budi Santoso",
    hadir: 90,
    terlambat: 7,
    tidakHadir: 3,
  },
  {
    matkul: "Basis Data",
    dosen: "Dr. Citra Lestari",
    hadir: 84,
    terlambat: 10,
    tidakHadir: 6,
  },
  {
    matkul: "Jaringan Komputer",
    dosen: "Dr. Dimas Pratama",
    hadir: 71,
    terlambat: 18,
    tidakHadir: 11,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

function GaugeChart({ value }: { value: number }) {
  const radius = 100;
  const stroke = 18;
  const normalizedRadius = radius - stroke / 2;
  const circumference = Math.PI * normalizedRadius;
  const progress = (value / 100) * circumference;

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
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            transition: "stroke-dashoffset 1s ease",
          }}
        />
      </svg>

      <div className="absolute top-12 flex flex-col items-center">
        <h1 className="text-5xl font-bold text-gray-800">
          {value}%
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
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[status as keyof typeof statusStyle]}`}
    >
      {status}
    </span>
  );
}

export default function DetailGaugeModal({
  open,
  onClose,
}: Props) {

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

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
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div
              className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl p-8 relative max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >

              {/* CLOSE */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X size={22} />
              </button>

              {/* HEADER */}
              <div className="flex justify-between items-start mb-10">

                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Kehadiran Dosen
                  </h1>

                  <p className="text-gray-500 mt-2">
                    Monitoring dan analisis performa kehadiran dosen
                  </p>
                </div>

                <div className="flex items-center gap-4 pr-12">
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                    <option>Semua Dosen</option>
                  </select>

                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                    <option>Semua Kelas</option>
                  </select>

                  <div className="flex gap-2 bg-gray-100 rounded-xl p-1 text-sm">
                    <button className="bg-white px-3 py-1 rounded-lg shadow-sm font-medium">
                      1H
                    </button>

                    <button className="px-3 py-1 text-gray-500">
                      1M
                    </button>

                    <button className="px-3 py-1 text-gray-500">
                      1B
                    </button>
                  </div>
                </div>
              </div>

              {/* TOP SECTION */}
              <div className="grid grid-cols-2 gap-10 items-center mb-12">

                {/* GAUGE */}
                <div className="flex justify-center">
                  <GaugeChart value={96} />
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 gap-5">
                  <KPIBox
                    title="Tepat Waktu"
                    value="86%"
                    color="#16A34A"
                  />

                  <KPIBox
                    title="Terlambat"
                    value="10%"
                    color="#D97706"
                  />

                  <KPIBox
                    title="Tidak Hadir"
                    value="4%"
                    color="#DC2626"
                  />

                  <KPIBox
                    title="Total Pertemuan"
                    value="128"
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
                    Persentase kehadiran dosen selama 7 hari terakhir
                  </p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
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

                <div className="grid grid-cols-2 gap-5">
                  {rankingData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {item.name}
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                          Kehadiran {item.attendance}%
                        </p>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
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
                      {attendanceTable.map((item, index) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}