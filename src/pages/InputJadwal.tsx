import { useState, useEffect } from "react";
import axios from "axios";
import { FiChevronDown } from "react-icons/fi";

export default function InputJadwal() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [jadwal, setJadwal] = useState<any[]>([]);

  // FILTER STATE
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedDosen, setSelectedDosen] = useState<string[]>([]);
  const [selectedMatkul, setSelectedMatkul] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string[]>([]);
  const [selectedWaktu, setSelectedWaktu] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // ===============================
  // FETCH DATA JADWAL
  // ===============================
  const fetchJadwal = async () => {
    try {
      const res = await axios.get(`${API_URL}/scheduled/jadwal`);
      console.log("DATA JADWAL:", res.data);
      setJadwal(res.data);
    } catch (error) {
      console.error("Gagal ambil jadwal:", error);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  // CLOSE DROPDOWN SAAT KLIK LUAR
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // LIST FILTER DATA
  const listDosen = [...new Set(jadwal.map((j) => j.dosen_utama))];
  const listMatkul = [...new Set(jadwal.map((j) => j.mata_kuliah))];
  const listKelas = [...new Set(jadwal.map((j) => j.kelas))];
  const listWaktu = [
    ...new Set(
      jadwal.map(
        (j) =>
          `${j.jam_mulai.slice(0, 5)} - ${j.jam_selesai.slice(0, 5)}`
      )
    ),
  ];

  // ===============================
  // HANDLE FILE SELECT
  // ===============================
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    setFiles([selectedFiles[0]]);
  };

  // ===============================
  // HANDLE SUBMIT
  // ===============================
  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Pilih file terlebih dahulu!");
      return;
    }

    const file = files[0];

    if (!file.name.endsWith(".csv")) {
      alert("File harus format CSV!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setProgress(0);

      const response = await axios.post(
        `${API_URL}/uploud/upload-csv`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) /
                progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      console.log(response.data);
      alert("Upload berhasil!");

      setFiles([]);
      setProgress(0);

      fetchJadwal();
    } catch (error: any) {
      console.error(error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Upload gagal!";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-xl font-semibold">Input Jadwal</h1>

      {/* UPLOAD CARD */}
      <div className="bg-white rounded-2xl shadow p-6">

        <h2 className="font-semibold mb-2">
          Media Upload
        </h2>

        <p className="text-sm text-gray-400 mb-4">
          Add your documents here, and you can upload up
          to 1 file max
        </p>

        <label className="border-2 border-dashed border-blue-300 rounded-xl p-10 flex flex-col items-center cursor-pointer hover:bg-gray-50">

          <span className="text-gray-500 mb-2">
            Drag your file(s) or browse
          </span>

          <span className="text-xs text-gray-400">
            Max 10 MB files are allowed
          </span>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium">
              Selected File:
            </p>
            <p className="text-gray-600">
              {files[0].name}
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Only support .csv files
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 px-6 py-2 rounded-lg text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#A44A4A]"
          }`}
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>

      {/* JADWAL GRID */}
      <div>

        {/* TITLE + FILTER */}
        <div className="flex items-center justify-between mb-4">

          <h2 className="font-semibold">
            Jadwal Perkuliahan
          </h2>

          <div className="flex gap-3">

            {/* DOSEN */}
            <FilterDropdown
              title="Kode Dosen"
              name="dosen"
              activeFilter={activeFilter}
              toggleFilter={toggleFilter}
              list={listDosen}
              selected={selectedDosen}
              setSelected={setSelectedDosen}
            />

            {/* MATKUL */}
            <FilterDropdown
              title="Matkul"
              name="matkul"
              activeFilter={activeFilter}
              toggleFilter={toggleFilter}
              list={listMatkul}
              selected={selectedMatkul}
              setSelected={setSelectedMatkul}
            />

            {/* WAKTU */}
            <FilterDropdown
              title="Waktu"
              name="waktu"
              activeFilter={activeFilter}
              toggleFilter={toggleFilter}
              list={listWaktu}
              selected={selectedWaktu}
              setSelected={setSelectedWaktu}
            />

            {/* KELAS */}
            <FilterDropdown
              title="Kelas"
              name="kelas"
              activeFilter={activeFilter}
              toggleFilter={toggleFilter}
              list={listKelas}
              selected={selectedKelas}
              setSelected={setSelectedKelas}
            />

          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {[
            "SENIN",
            "SELASA",
            "RABU",
            "KAMIS",
            "JUMAT",
            "SABTU",
          ].map((day) => (
            <div
              key={day}
              className="bg-white rounded-xl shadow"
            >
              <div className="bg-[#A44A4A] text-white text-center py-2 rounded-t-xl">
                {day}
              </div>

              <div className="p-4 space-y-3">

                {jadwal
                  .filter((item) => item.hari === day)
                  .filter((item) =>
                    selectedDosen.length === 0
                      ? true
                      : selectedDosen.includes(
                          item.dosen_utama
                        )
                  )
                  .filter((item) =>
                    selectedMatkul.length === 0
                      ? true
                      : selectedMatkul.includes(
                          item.mata_kuliah
                        )
                  )
                  .filter((item) =>
                    selectedKelas.length === 0
                      ? true
                      : selectedKelas.includes(item.kelas)
                  )
                  .filter((item) =>
                    selectedWaktu.length === 0
                      ? true
                      : selectedWaktu.includes(
                          `${item.jam_mulai.slice(
                            0,
                            5
                          )} - ${item.jam_selesai.slice(
                            0,
                            5
                          )}`
                        )
                  )
                  .sort((a, b) =>
                    a.jam_mulai.localeCompare(
                      b.jam_mulai
                    )
                  )
                  .map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 text-xs"
                    >
                      {item.kode_mata_kuliah} -{" "}
                      {item.mata_kuliah} -{" "}
                      {item.dosen_utama}

                      <br />

                      <span className="text-gray-400">
                        {item.jam_mulai.slice(0, 5)} -{" "}
                        {item.jam_selesai.slice(0, 5)}
                      </span>
                    </div>
                  ))}

              </div>
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

function FilterDropdown({
  title,
  name,
  activeFilter,
  toggleFilter,
  list,
  selected,
  setSelected,
}: any) {

  return (
    <div className="relative">

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFilter(name);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-sm text-gray-700 hover:shadow transition"
      >
        {title} <FiChevronDown />
      </button>

      {activeFilter === name && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl p-3 z-20"
        >

          {list.map((item: string, i: number) => (
            <label
              key={i}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => {

                  if (selected.includes(item)) {
                    setSelected(
                      selected.filter(
                        (d: string) => d !== item
                      )
                    );
                  } else {
                    setSelected([...selected, item]);
                  }

                }}
              />

              {item}

            </label>
          ))}

        </div>
      )}

    </div>
  );
}