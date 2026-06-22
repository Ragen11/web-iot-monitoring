import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiChevronDown, FiX, FiUploadCloud, FiFile, FiTrash2, FiDownload } from "react-icons/fi";
import { BsFiletypeCsv, BsFiletypeXlsx, BsFiletypePdf, BsFiletypeTxt } from "react-icons/bs";
import { useTahunAjaran } from "../context/TahunAjaranContext";
import ConfirmDialog from "../components/ConfirmDialog";

// Batas ukuran file upload: 1 MB
const MAX_FILE_BYTES = 1 * 1024 * 1024;

export default function InputJadwal() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [fileReady, setFileReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jadwal, setJadwal] = useState<any[]>([]);

  // hapus jadwal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeFilter, setActiveFilter]     = useState<string | null>(null);
  const [selectedDosen, setSelectedDosen]   = useState<string[]>([]);
  const [selectedMatkul, setSelectedMatkul] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas]   = useState<string[]>([]);
  const [selectedWaktu, setSelectedWaktu]   = useState<string[]>([]);
  const [selectedRuangan, setSelectedRuangan] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected, aktif } = useTahunAjaran();
  const taId       = selected?.id;
  const taAktifId  = aktif?.id;

  const fetchJadwal = async () => {
    try {
      const params: any = {};
      if (taId) params.tahun_ajaran_id = taId;
      const res = await axios.get(`${API_URL}/scheduled/jadwal`, { params });
      setJadwal(res.data);
    } catch (error) {
      console.error("Gagal ambil jadwal:", error);
    }
  };

  useEffect(() => {
    fetchJadwal();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taId]);

  const handleDeleteJadwal = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/scheduled/jadwal/${id}`);
      toast.success("Jadwal berhasil dihapus");
      setDeleteTarget(null);
      // Hapus dari state lokal langsung. Backend meng-cache list jadwal (TTL 10
      // menit) & tidak invalidasi saat delete, jadi refetch bisa mengembalikan
      // data stale — maka kita filter manual, bukan fetchJadwal().
      setJadwal((prev) => prev.filter((j) => j.id !== id));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || error?.message || "Gagal menghapus jadwal"
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  const listDosen   = [...new Set(jadwal.map((j) => j.dosen_utama))];
  const listMatkul  = [...new Set(jadwal.map((j) => j.mata_kuliah))];
  const listKelas   = [...new Set(jadwal.map((j) => j.kelas))];
  // Urutan custom: TULT dulu, lalu KU3, lalu lainnya (alfabetis)
  const RUANGAN_PRIORITY: Record<string, number> = {
    TULT: 1,
    KU3:  2,
  };
  const listRuangan = [...new Set(jadwal.map((j) => j.ruangan))].sort((a, b) => {
    const prefixA = (a || "").split(" ")[0];
    const prefixB = (b || "").split(" ")[0];
    const priA = RUANGAN_PRIORITY[prefixA] ?? 99;
    const priB = RUANGAN_PRIORITY[prefixB] ?? 99;
    if (priA !== priB) return priA - priB;
    return (a || "").localeCompare(b || "");
  });
  const listWaktu   = [
    ...new Set(
      jadwal.map(
        (j) =>
          `${j.jam_mulai.slice(0, 5)} - ${j.jam_selesai.slice(0, 5)}`
      )
    ),
  ].sort();   // urut dari paling pagi ke paling malam (string sort jam HH:MM)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const picked = Array.from(e.target.files)[0];
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      toast.error("Ukuran file melebihi 1 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFiles([picked]);
    setFileReadProgress(0);
    setFileReady(false);

    if (intervalRef.current) clearInterval(intervalRef.current);

    let prog = 0;
    intervalRef.current = setInterval(() => {
      prog += 5;
      setFileReadProgress(prog);
      if (prog >= 100) {
        clearInterval(intervalRef.current!);
        setFileReady(true);
      }
    }, 60);
  };

  const handleRemoveFile = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFiles([]);
    setFileReadProgress(0);
    setFileReady(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Pilih file terlebih dahulu!");
      return;
    }

    const file = files[0];

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      toast.error("File harus format XLSX!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (taAktifId) formData.append("tahun_ajaran_id", taAktifId);

    try {
      setLoading(true);
      setProgress(0);

      const response = await axios.post(
        `${API_URL}/upload/xlsx`,
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
      toast.success("Upload jadwal berhasil!");

      setFiles([]);
      setProgress(0);
      setFileReadProgress(0);
      setFileReady(false);

      fetchJadwal();
    } catch (error: any) {
      console.error(error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Upload gagal!";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "csv") return <BsFiletypeCsv size={40} className="text-green-600" />;
    if (ext === "xlsx" || ext === "xls") return <BsFiletypeXlsx size={40} className="text-emerald-600" />;
    if (ext === "pdf") return <BsFiletypePdf size={40} className="text-red-500" />;
    if (ext === "txt") return <BsFiletypeTxt size={40} className="text-gray-500" />;
    return <FiFile size={40} className="text-gray-400" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <h1 className="text-xl font-semibold">Input Jadwal</h1>

      {/* UPLOAD + CONTOH TEMPLATE — sebelahan (kiri upload, kanan contoh) */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">

      {/* UPLOAD CARD */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6 flex-1 min-w-0 flex flex-col">

        <h2 className="font-semibold mb-2">
          Media Upload
        </h2>

        <p className="text-sm text-gray-400 mb-4">
          Add your documents here, and you can upload up
          to 1 file max
        </p>

        <label className="border-2 border-dashed border-blue-300 rounded-xl p-6 sm:p-10 flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 transition">

          <FiUploadCloud size={48} className="text-blue-400" />

          <span className="text-gray-600 font-medium">
            Drag your file(s) or browse
          </span>

          <span className="text-xs text-gray-400">
            Max 1 MB files are allowed
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* File info + tombol hapus */}
            <div className="flex items-center gap-4 bg-gray-50 border rounded-lg px-4 py-3">
              <div className="flex-shrink-0">
                {getFileIcon(files[0].name)}
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium text-gray-700 truncate">{files[0].name}</p>
                <p className="text-gray-400 text-xs">
                  {(files[0].size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                disabled={loading}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition disabled:opacity-40"
                title="Hapus file"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Progress bar: file reading */}
            {!fileReady && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-75"
                    style={{ width: `${fileReadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Memproses file... {fileReadProgress}%
                </p>
              </div>
            )}

            {fileReady && !loading && (
              <p className="text-xs text-green-600 font-medium">
                ✓ File siap untuk di-submit
              </p>
            )}
          </div>
        )}

        {/* Progress bar: upload ke server */}
        {loading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Only support .xlsx files
        </p>

        <button
          onClick={handleSubmit}
          disabled={!fileReady || loading}
          className={`mt-4 self-start px-6 py-2 rounded-lg text-white transition ${
            !fileReady || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>

      {/* CONTOH TEMPLATE */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6 flex-1 min-w-0">
        <h2 className="font-semibold mb-1">Contoh Template</h2>
        <p className="text-sm text-gray-400 mb-4">
          Pastikan kolom file Excel sesuai format berikut: <span className="font-medium text-gray-500">Hari, Shift, Ruangan, Kode Mata Kuliah, Nama Mata Kuliah, Kelas, Dosen, Jenis</span>.
        </p>

        <img
          src="/template-jadwal.png"
          alt="Contoh template jadwal"
          className="block w-full max-w-xl mx-auto rounded-xl border border-gray-100 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        <div className="text-center">
          <a
            href="/template-jadwal.xlsx"
            download="template-jadwal.xlsx"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark transition"
          >
            <FiDownload size={16} />
            Download Template (.xlsx)
          </a>
        </div>
      </div>

      </div>{/* end flex: upload + contoh template */}

      {/* JADWAL GRID */}
      <div>

        {/* TITLE + FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <h2 className="font-semibold">
            Jadwal Perkuliahan
          </h2>

          <div className="flex flex-wrap gap-2">

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

            {/* RUANGAN */}
            <FilterDropdown
              title="Ruangan"
              name="ruangan"
              activeFilter={activeFilter}
              toggleFilter={toggleFilter}
              list={listRuangan}
              selected={selectedRuangan}
              setSelected={setSelectedRuangan}
            />

          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

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
              <div className="bg-primary text-white text-center py-2 rounded-t-xl">
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
                  .filter((item) =>
                    selectedRuangan.length === 0
                      ? true
                      : selectedRuangan.includes(item.ruangan)
                  )
                  .sort((a, b) =>
                    a.jam_mulai.localeCompare(
                      b.jam_mulai
                    )
                  )
                  .map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="border rounded-lg p-3 text-xs flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        {item.ruangan} -{" "}
                        {item.kode_mata_kuliah} -{" "}
                        {item.mata_kuliah} -{" "}
                        {item.dosen_utama}

                        <br />

                        <span className="text-gray-400">
                          {item.jam_mulai.slice(0, 5)} -{" "}
                          {item.jam_selesai.slice(0, 5)}
                        </span>
                      </div>

                      {item.id != null && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                          title="Hapus jadwal ini"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

              </div>
            </div>
          ))}

        </div>

      </div>

      {/* Konfirmasi hapus jadwal */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Jadwal"
        message={
          deleteTarget
            ? `Yakin ingin menghapus jadwal ${deleteTarget.kode_mata_kuliah} - ${deleteTarget.mata_kuliah} (${deleteTarget.kelas})? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
        confirmLabel={deleting ? "Menghapus..." : "Ya, Hapus"}
        onConfirm={handleDeleteJadwal}
        onCancel={() => setDeleteTarget(null)}
      />

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

  const isOpen = activeFilter === name;

  // Label tombol: kalau ada yang dipilih → tampilkan jumlah, kalau tidak → tampilkan title
  const buttonLabel =
    selected.length > 0 ? `${title} (${selected.length})` : title;

  return (
    <div className="relative">

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFilter(name);
        }}
        className={`w-40 px-4 py-2 flex items-center justify-between gap-2 bg-white border rounded-xl text-sm transition ${
          selected.length > 0
            ? "border-primary/40 text-primary font-medium"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <FiChevronDown
          className={`shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          } ${selected.length > 0 ? "text-primary" : "text-gray-400"}`}
          size={16}
        />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-[calc(100%+4px)] left-0 w-48 bg-white border border-gray-100 shadow-lg rounded-xl p-1.5 z-30 max-h-64 overflow-y-auto"
        >

          {list.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Tidak ada data</p>
          ) : (
            list.map((item: string, i: number) => {
              const checked = selected.includes(item);
              return (
                <label
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        setSelected(
                          selected.filter((d: string) => d !== item)
                        );
                      } else {
                        setSelected([...selected, item]);
                      }
                    }}
                    className="accent-primary"
                  />
                  <span className="truncate">{item}</span>
                </label>
              );
            })
          )}

        </div>
      )}

    </div>
  );
}