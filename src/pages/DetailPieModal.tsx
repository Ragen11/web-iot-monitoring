import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { X } from "lucide-react";

const summaryData = [
  { name: "Ceramah", value: 52.1, color: "#9F4A4A" },
  { name: "Tanya Jawab", value: 22.8, color: "#000000" },
  { name: "Diskusi", value: 13.9, color: "#E6C7C7" },
  { name: "Tidak Ada", value: 11.2, color: "#6B7280" },
];

const tableData = [
  {
    matkul: "Kalkulus",
    ceramah: 52,
    tanya: 22,
    diskusi: 14,
    tidakAda: 11,
  },
  {
    matkul: "Persamaan Diferensial",
    ceramah: 67,
    tanya: 15,
    diskusi: 10,
    tidakAda: 8,
  },
  {
    matkul: "Proposal Tugas Akhir",
    ceramah: 34,
    tanya: 40,
    diskusi: 18,
    tidakAda: 8,
  },
  {
    matkul: "Machine Learning",
    ceramah: 48,
    tanya: 27,
    diskusi: 20,
    tidakAda: 5,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 min-w-[150px]">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span className="text-sm text-gray-700 w-10 text-right">
        {value}%
      </span>
    </div>
  );
}

export default function DetailPieModal({ open, onClose }: Props) {

  // ESC close
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div
              className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >

              {/* CLOSE BUTTON */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X size={22} />
              </button>

              {/* HEADER */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Aktivitas Pembelajaran
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Detail distribusi metode pembelajaran per mata kuliah
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

              {/* TOP SUMMARY */}
              <div className="grid grid-cols-2 gap-1 items-center mb-10 pr-12">

                {/* PIE */}
                <div className="flex justify-center">
                  <div className="w-72 h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={summaryData}
                          dataKey="value"
                          innerRadius={70}
                          outerRadius={110}
                          stroke="none"
                        >
                          {summaryData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* LEGEND */}
                <div className="space-y-5">
                  {summaryData.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />

                        <span className="text-lg text-gray-800">
                          {item.name}
                        </span>
                      </div>

                      <span className="text-lg font-semibold text-gray-900">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="pb-3">Mata Kuliah</th>
                      <th className="pb-3">Ceramah</th>
                      <th className="pb-3">Tanya Jawab</th>
                      <th className="pb-3">Diskusi</th>
                      <th className="pb-3">Tidak Ada</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableData.map((item, index) => (
                      <tr
                        key={index}
                        className="bg-gray-50 hover:bg-gray-100 transition rounded-2xl"
                      >
                        <td className="p-4 rounded-l-2xl font-semibold text-gray-800">
                          {item.matkul}
                        </td>

                        <td className="p-4">
                          <ProgressBar
                            value={item.ceramah}
                            color="#9F4A4A"
                          />
                        </td>

                        <td className="p-4">
                          <ProgressBar
                            value={item.tanya}
                            color="#000000"
                          />
                        </td>

                        <td className="p-4">
                          <ProgressBar
                            value={item.diskusi}
                            color="#E6C7C7"
                          />
                        </td>

                        <td className="p-4 rounded-r-2xl">
                          <ProgressBar
                            value={item.tidakAda}
                            color="#6B7280"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}