import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function HasilMonitoring() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // close saat klik luar
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="p-6">
      {/* TITLE */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Hasil Monitoring
      </h1>

      {/* 🔥 FILTER */}
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
      </div>

      {/* 🔥 TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Jam</th>
              <th className="p-3 text-left">Matkul</th>
              <th className="p-3 text-left">Kode Dosen</th>
              <th className="p-3 text-left">Nama Dosen</th>
              <th className="p-3 text-left">Kehadiran</th>
              <th className="p-3 text-left">Aktivitas Dominan</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3">05/12/2025</td>
              <td className="p-3">08.00 - 10.00</td>
              <td className="p-3">Alpro</td>
              <td className="p-3">AGV</td>
              <td className="p-3">Agus Virgono</td>
              <td className="p-3 text-green-600">✔ Tepat Waktu</td>
              <td className="p-3">Ceramah</td>
            </tr>

            <tr className="border-t bg-gray-50">
              <td className="p-3">05/12/2025</td>
              <td className="p-3">10.00 - 12.00</td>
              <td className="p-3">Alpro</td>
              <td className="p-3">BRH</td>
              <td className="p-3">Burhanudin</td>
              <td className="p-3 text-green-600">✔ Tepat Waktu</td>
              <td className="p-3">Ceramah</td>
            </tr>

            <tr className="border-t">
              <td className="p-3">05/12/2025</td>
              <td className="p-3">12.00 - 15.00</td>
              <td className="p-3">PTA</td>
              <td className="p-3">RLC</td>
              <td className="p-3">Roswan</td>
              <td className="p-3 text-green-600">✔ Tepat Waktu</td>
              <td className="p-3">Ceramah</td>
            </tr>
          </tbody>
        </table>
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
          <label key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}