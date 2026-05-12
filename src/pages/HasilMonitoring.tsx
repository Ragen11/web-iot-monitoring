import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HasilMonitoring() {

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<any>({});

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // ===============================
  // CLOSE DROPDOWN
  // ===============================
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // ===============================
  // SCAN GOOGLE DRIVE
  // ===============================
  const scanDrive = async () => {
    try {
      await axios.post(`${API_URL}/monitoring/scan-drive`);
      console.log("📡 scan selesai");
    } catch (err) {
      console.error("❌ Scan error:", err);
    }
  };

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchMonitoring = async () => {
    try {
      const res = await axios.get(`${API_URL}/monitoring`);

      // 🔥 pastikan array
      const safeData = Array.isArray(res.data) ? res.data : [];

      setData(safeData);
      setFilteredData(safeData);

      console.log("✅ fetch data terbaru");

    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  // ===============================
  // INIT FLOW
  // ===============================
  useEffect(() => {

    const init = async () => {

      // 1. Scan dulu (biar DB update)
      await scanDrive();

      // 2. Ambil data terbaru
      await fetchMonitoring();

    };

    init();

  }, []);

  // ===============================
  // FILTER LOGIC
  // ===============================
  useEffect(() => {

    let result = [...data];

    Object.keys(selectedFilter).forEach((key) => {
      if (selectedFilter[key]) {
        result = result.filter(
          (item) => String(item[key]) === String(selectedFilter[key])
        );
      }
    });

    setFilteredData(result);

  }, [selectedFilter, data]);

  // ===============================
  // GET OPTIONS DINAMIS
  // ===============================
  const getOptions = (field: string) => {

    let temp = [...data];

    Object.keys(selectedFilter).forEach((key) => {
      if (key !== field && selectedFilter[key]) {
        temp = temp.filter(
          (item) => String(item[key]) === String(selectedFilter[key])
        );
      }
    });

    return [...new Set(temp.map((item) => item[field]))];

  };

  return (
    <div className="p-6">

      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Hasil Monitoring
      </h1>

      {/* FILTER */}
      <div className="flex gap-4 mb-6 relative">

        {[
          { key: "tanggal", label: "Tanggal" },
          { key: "jam", label: "Waktu" },
          { key: "ruangan", label: "Ruangan" },
          { key: "matkul", label: "Matkul" },
          { key: "kodeDosen", label: "Dosen" },
          { key: "kelas", label: "Kelas" }
        ].map((filter) => (

          <div key={filter.key} className="relative">

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFilter(filter.key);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow text-sm"
            >
              {selectedFilter[filter.key] || filter.label}
              <FiChevronDown />
            </button>

            {activeFilter === filter.key && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-12 left-0 w-48 bg-white shadow-lg rounded-xl p-3 z-20"
              >

                {getOptions(filter.key).map((opt: any, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedFilter({
                        ...selectedFilter,
                        [filter.key]: opt
                      });
                      setActiveFilter(null);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {opt}
                  </div>
                ))}

              </div>
            )}

          </div>

        ))}

        {/* RESET */}
        <button
          onClick={() => setSelectedFilter({})}
          className="px-4 py-2 bg-red-100 text-red-500 rounded-xl text-sm"
        >
          Reset
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Jam</th>
              <th className="p-3 text-left">Ruangan</th>
              <th className="p-3 text-left">Matkul</th>
              <th className="p-3 text-left">Kode Dosen</th>
              <th className="p-3 text-left">Kehadiran</th>
              <th className="p-3 text-left">Aktivitas</th>
              <th className="p-3 text-left">Kelas</th>
            </tr>
          </thead>

          <tbody>

            {Array.isArray(filteredData) && filteredData.map((item, index) => (

              <tr
                key={item.id}
                onClick={() => navigate(`/monitoring/${item.id}`)}
                className={`border-t cursor-pointer hover:bg-gray-100
                  ${index % 2 ? "bg-gray-50" : ""}
                `}
              >
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jam}</td>
                <td className="p-3">{item.ruangan}</td>
                <td className="p-3">{item.matkul}</td>
                <td className="p-3">{item.kodeDosen}</td>
                <td className="p-3 text-green-600">✔ {item.kehadiran}</td>
                <td className="p-3">{item.aktivitas}</td>
                <td className="p-3">{item.kelas}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}