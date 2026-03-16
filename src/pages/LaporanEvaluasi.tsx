import { useState, useEffect } from "react";
import { FiChevronDown, FiMenu, FiDownload, FiPrinter, FiMoreVertical } from "react-icons/fi";

export default function LaporanEvaluasi() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // 🔥 close dropdown saat klik luar
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="p-6">
      {/* TITLE */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Laporan Evaluasi
      </h1>

      {/* FILTER */}
      <div className="flex items-center gap-4 mb-6 relative">

        {/* KODE DOSEN */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFilter("dosen");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
          >
            Kode Dosen <FiChevronDown />
          </button>

          {activeFilter === "dosen" && (
            <DropdownCheckbox title="Filter Kode Dosen" />
          )}
        </div>

        {/* MATKUL */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFilter("matkul");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
          >
            Matkul <FiChevronDown />
          </button>

          {activeFilter === "matkul" && (
            <DropdownCheckbox title="Filter Matkul" />
          )}
        </div>

        {/* WAKTU */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFilter("waktu");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
          >
            Waktu <FiChevronDown />
          </button>

          {activeFilter === "waktu" && (
            <DropdownCheckbox title="Filter Waktu" />
          )}
        </div>

        {/* KELAS */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFilter("kelas");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
          >
            Kelas <FiChevronDown />
          </button>

          {activeFilter === "kelas" && (
            <DropdownCheckbox title="Filter Kelas" />
          )}
        </div>

        {/* GENERATE BUTTON */}
        <button className="flex items-center gap-2 bg-[#A44A4A] text-white px-5 py-2 rounded-lg shadow hover:opacity-90 transition">
          Generate
        </button>
      </div>

      {/* PDF VIEWER */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between bg-[#1F2937] text-white px-4 py-3 rounded-t-2xl">

          <div className="flex items-center gap-3">
            <FiMenu />
            <span className="text-sm">
              Laporan Evaluasi 1 Minggu
            </span>
            <span className="bg-black text-xs px-2 py-1 rounded">
              1 / 2
            </span>
          </div>

          <div className="flex items-center gap-4 text-lg">
            <FiDownload className="cursor-pointer" />
            <FiPrinter className="cursor-pointer" />
            <FiMoreVertical className="cursor-pointer" />
          </div>
        </div>

        {/* CONTENT */}
        <div className="h-[400px] flex items-center justify-center text-gray-400">
          Preview Laporan PDF
        </div>

      </div>
    </div>
  );
}

function DropdownCheckbox({ title }: { title: string }) {
  const list = ["AGV", "BRH", "EDY", "RLC"];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 left-0 w-56 bg-white shadow-lg rounded-xl p-4 z-20 animate-fadeIn"
    >
      <p className="text-xs text-gray-400 mb-2">{title}</p>

      <div className="space-y-2">
        {list.map((item, i) => (
          <label
            key={i}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input type="checkbox" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}