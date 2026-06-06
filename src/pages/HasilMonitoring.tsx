import { useState, useEffect } from "react";
import { FiRotateCcw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SkeletonTable } from "../components/Skeleton";
import FilterDropdown, { type FilterOption } from "../components/FilterDropdown";
import { useTahunAjaran } from "../context/TahunAjaranContext";

export default function HasilMonitoring() {

  const [data, setData]                   = useState<any[]>([]);
  const [filteredData, setFilteredData]   = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<any>({});
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const ITEMS_PER_PAGE = 10;

  const navigate = useNavigate();
  const API_URL  = import.meta.env.VITE_API_URL;
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  const scanDrive = async () => {
  try {
    const res = await axios.post(`${API_URL}/monitoring/scan-drive`);
    const result = res.data;

    console.log(`📡 Scan selesai | status=${result.status} | found=${result.videos_found} | inserted=${result.videos_matched?.length}`);

    // Debug: tampilkan file yang gagal di-parse atau gagal match jadwal
    if (result.skipped_parse?.length > 0) {
      console.warn("⚠️ File gagal di-parse (nama file tidak sesuai format):", result.skipped_parse);
    }
    if (result.skipped_jadwal?.length > 0) {
      console.warn("⚠️ File tidak cocok dengan jadwal di DB:", result.skipped_jadwal);
    }
    if (result.status === "skip") {
      console.log("⏭️ Scan di-skip (cooldown 60 detik)");
    }

  } catch (err) {
    console.error("❌ Scan error:", err);
  }
  };

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (taId) params.tahun_ajaran_id = taId;
      const res = await axios.get(`${API_URL}/monitoring`, { params });
      const safeData = Array.isArray(res.data) ? res.data : [];
      setData(safeData);
      setFilteredData(safeData);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    const init = async () => {

      // 1. Scan dulu (biar DB update) — hanya saat first mount
      await scanDrive();

      // 2. Ambil data terbaru (sesuai TA selected)
      await fetchMonitoring();

    };

    init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taId]);

  useEffect(() => {

    let result = [...data];

    Object.keys(selectedFilter).forEach((key) => {
      if (selectedFilter[key]) {
        result = result.filter(
          (item) => String(item[key]) === String(selectedFilter[key])
        );
      }
    });

    // Urutkan secara default berdasarkan tanggal (terlama di atas), lalu jam
    result.sort((a, b) => {
      const diff = parseTanggal(a.tanggal) - parseTanggal(b.tanggal);
      if (diff !== 0) return diff;
      return String(a.jam || "").localeCompare(String(b.jam || ""));
    });

    setFilteredData(result);
    setPage(1);

  }, [selectedFilter, data]);

  // Parse tanggal jadi timestamp untuk sorting (dukung "YYYY-MM-DD" & "DD-MM-YYYY")
  const parseTanggal = (val: string) => {
    if (!val) return 0;
    const parts = String(val).split(/[-/]/);
    if (parts.length !== 3) return new Date(val).getTime() || 0;
    const [a, b, c] = parts;
    // Jika bagian pertama 4 digit -> YYYY-MM-DD, selain itu DD-MM-YYYY
    const iso = a.length === 4 ? `${a}-${b}-${c}` : `${c}-${b}-${a}`;
    return new Date(iso).getTime() || 0;
  };

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
    <div className="p-4 sm:p-6">

      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Hasil Monitoring
      </h1>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2 mb-6">

        {[
          { key: "tanggal",   label: "Tanggal" },
          { key: "jam",       label: "Waktu" },
          { key: "ruangan",   label: "Ruangan" },
          { key: "matkul",    label: "Matkul" },
          { key: "kodeDosen", label: "Dosen" },
          { key: "kelas",     label: "Kelas" },
        ].map((filter) => (
          <FilterDropdown
            key={filter.key}
            width="w-40"
            label={filter.label}
            value={selectedFilter[filter.key] || ""}
            onChange={(v) =>
              setSelectedFilter({ ...selectedFilter, [filter.key]: v })
            }
            options={getOptions(filter.key).map<FilterOption>((opt: any) => ({
              value: String(opt),
              label: String(opt),
            }))}
          />
        ))}

        {/* RESET — hanya tampil saat ada filter aktif */}
        {Object.values(selectedFilter).some(Boolean) && (
          <button
            onClick={() => { setSelectedFilter({}); setPage(1); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition"
          >
            <FiRotateCcw size={13} />
            Reset Filter
          </button>
        )}

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">

        <table className="w-full text-sm min-w-[700px]">

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
            {loading ? (
              <SkeletonTable rows={8} cols={8} />
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400 text-sm">
                  Tidak ada data monitoring yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredData
                .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                .map((item, index) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/monitoring/${item.id}`, { state: item })}
                  className={`border-t cursor-pointer hover:bg-gray-100 ${index % 2 ? "bg-gray-50" : ""}`}
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
              ))
            )}
          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      {!loading && filteredData.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-1">
          <p className="text-xs text-gray-400">
            Menampilkan {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredData.length)}–
            {Math.min(page * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>

            {Array.from({ length: Math.ceil(filteredData.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === Math.ceil(filteredData.length / ITEMS_PER_PAGE) || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      page === p
                        ? "bg-primary text-white border-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(filteredData.length / ITEMS_PER_PAGE), p + 1))}
              disabled={page === Math.ceil(filteredData.length / ITEMS_PER_PAGE)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ›
            </button>
          </div>
        </div>
      )}

    </div>
  );
}