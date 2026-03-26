import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function HasilMonitoring() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const navigate = useNavigate(); 

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // close saat klik luar
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // 🔥 DATA (biar bisa dikirim ke detail)
  const data = [
    {
      id: 1,
      tanggal: "05/12/2025",
      jam: "08.00 - 10.00",
      matkul: "Alpro",
      kode: "TKI2H4",
      hari: "Kamis",
      ruangan: "TULT 14.15",
      kodeDosen: "AGV",
      namaDosen: "Agus Virgono",
      kehadiran: "Tepat Waktu",
      aktivitas: "Ceramah",
    },
    {
      id: 2,
      tanggal: "05/12/2025",
      jam: "10.00 - 12.00",
      matkul: "Alpro",
      kode: "TKI2H4",
      hari: "Kamis",
      ruangan: "TULT 14.15",
      kodeDosen: "BRH",
      namaDosen: "Burhanudin",
      kehadiran: "Tepat Waktu",
      aktivitas: "Ceramah",
    },
    {
      id: 3,
      tanggal: "05/12/2025",
      jam: "12.00 - 15.00",
      matkul: "PTA",
      kode: "TKI2H4",
      hari: "Kamis",
      ruangan: "TULT 14.15",
      kodeDosen: "RLC",
      namaDosen: "Roswan",
      kehadiran: "Tepat Waktu",
      aktivitas: "Ceramah",
    },
  ];

  return (
    <div className="p-6">
      {/* TITLE */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Hasil Monitoring
      </h1>

      {/* 🔥 FILTER */}
      <div className="flex items-center gap-4 mb-6 relative">

        {["dosen", "matkul", "waktu", "kelas"].map((item) => (
          <div className="relative" key={item}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFilter(item);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)} <FiChevronDown />
            </button>

            {activeFilter === item && (
              <DropdownCheckbox title={`Filter ${item}`} />
            )}
          </div>
        ))}

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
            {data.map((item, index) => (
              <tr
                key={item.id}
                onClick={() =>
                  navigate(`/monitoring/${item.id}`, { state: item })
                }
                className={`border-t cursor-pointer transition-all duration-200
                  hover:bg-gray-100 hover:shadow-sm
                  ${index % 2 === 1 ? "bg-gray-50" : ""}
                `}
              >
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jam}</td>
                <td className="p-3">{item.matkul}</td>
                <td className="p-3">{item.kodeDosen}</td>
                <td className="p-3">{item.namaDosen}</td>
                <td className="p-3 text-green-600">
                  ✔ {item.kehadiran}
                </td>
                <td className="p-3">{item.aktivitas}</td>
              </tr>
            ))}
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