import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiX,
  FiUploadCloud,
  FiFile,
  FiCalendar,
  FiClock,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { BsFiletypePdf } from "react-icons/bs";
import { useTahunAjaran } from "../context/TahunAjaranContext";

// Batas ukuran file upload: 1 MB
const MAX_FILE_BYTES = 1 * 1024 * 1024;

export default function PengaturanPertemuan() {
  // upload state
  const [files, setFiles]                       = useState<File[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [progress, setProgress]                 = useState(0);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [fileReady, setFileReady]               = useState(false);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected, aktif } = useTahunAjaran();

  // ── Config dari BE ─────────────────────────────────────────────────────────
  const [semesterStartDate, setSemesterStartDate] = useState<string | null>(null);
  const [skipWeeks, setSkipWeeks]                 = useState<string[]>([]);
  const [mingguBerjalan, setMingguBerjalan]       = useState<number | null>(null);
  const [configLoading, setConfigLoading]         = useState(true);
  const [skipLoading, setSkipLoading]             = useState(false);
  const [newSkip, setNewSkip]                     = useState<string>("");

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const params: any = {};
      if (selected?.id) params.tahun_ajaran_id = selected.id;
      const res = await axios.get(`${API_URL}/pertemuan/config`, { params });
      setSemesterStartDate(res.data.semester_start_date ?? null);
      setSkipWeeks(res.data.skip_dates ?? []);
      setMingguBerjalan(res.data.minggu_berjalan ?? null);
    } catch {
      toast.error("Gagal memuat konfigurasi pertemuan");
    } finally {
      setConfigLoading(false);
    }
  }, [API_URL, selected?.id]);

  useEffect(() => {
    fetchConfig();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchConfig]);

  const handleAddSkip = async () => {
    if (!newSkip) { toast.error("Pilih tanggal minggu skip terlebih dahulu"); return; }
    setSkipLoading(true);
    try {
      await axios.post(`${API_URL}/pertemuan/skip-dates`, {
        tanggal: newSkip,
        tahun_ajaran_id: selected?.id ?? undefined,
      });
      toast.success("Minggu skip ditambahkan");
      setNewSkip("");
      await fetchConfig();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menambahkan minggu skip");
    } finally {
      setSkipLoading(false);
    }
  };

  const handleRemoveSkip = async (tanggal: string) => {
    setSkipLoading(true);
    try {
      await axios.delete(`${API_URL}/pertemuan/skip-dates/${tanggal}`, {
        params: { tahun_ajaran_id: selected?.id ?? undefined },
      });
      toast.success("Minggu skip dihapus");
      await fetchConfig();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menghapus minggu skip");
    } finally {
      setSkipLoading(false);
    }
  };

  const mingguLabel = configLoading
    ? "Memuat..."
    : mingguBerjalan !== null
    ? `Minggu ke-${mingguBerjalan}`
    : "Di luar jadwal perkuliahan";

  const fmtTanggal = (val: string) =>
    new Date(val).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // ── FILE HANDLING ───────────────────────────────────────────
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
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("File harus format PDF!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setProgress(0);

      const response = await axios.post(
        `${API_URL}/kalender-akademik/upload-pdf`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      toast.success(response.data?.message || "Upload kalender akademik berhasil!");

      // reset upload & refresh config dari DB
      setFiles([]);
      setProgress(0);
      setFileReadProgress(0);
      setFileReady(false);
      await fetchConfig();
    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);
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
    if (ext === "pdf") return <BsFiletypePdf size={40} className="text-red-500" />;
    return <FiFile size={40} className="text-gray-400" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Pengaturan Pertemuan</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Kelola kalender akademik sebagai acuan perhitungan minggu perkuliahan.
        </p>
      </div>

      {/* INFO MINGGU SAAT INI */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="text-primary" size={18} />
          <h2 className="font-semibold text-gray-700">Status Minggu Saat Ini</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Minggu berjalan</span>
            <span className="font-medium text-primary">{mingguLabel}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Tahun Ajaran aktif</span>
            <span className="font-medium text-gray-700">
              {selected?.label || aktif?.label || "-"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Awal semester</span>
            <span className="font-medium text-gray-700">
              {semesterStartDate ? fmtTanggal(semesterStartDate) : "Belum dikonfigurasi"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Minggu libur (skip)</span>
            <span className="font-medium text-gray-700 text-right">
              {skipWeeks.length > 0
                ? skipWeeks.map((d) => fmtTanggal(d)).join(", ")
                : "—"}
            </span>
          </div>
        </div>

        {!semesterStartDate && !configLoading && (
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            <FiCalendar className="inline mb-0.5 mr-1" size={12} />
            Belum ada konfigurasi kalender. Upload kalender akademik di bawah
            agar sistem dapat menghitung minggu perkuliahan secara otomatis.
          </p>
        )}
      </div>

      {/* INPUT MANUAL MINGGU SKIP */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <FiCalendar className="text-primary" size={18} />
          <h2 className="font-semibold text-gray-700">Minggu Skip (Libur)</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Tambahkan tanggal yang termasuk minggu libur. Pilih tanggal di dalam
          minggu yang diliburkan — minggu tersebut tidak dihitung dalam urutan
          pertemuan.
        </p>

        {/* Form tambah */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="date"
            value={newSkip}
            onChange={(e) => setNewSkip(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary transition"
          />
          <button
            onClick={handleAddSkip}
            disabled={skipLoading}
            className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            <FiPlus size={15} />
            Tambah
          </button>
        </div>

        {/* Daftar minggu skip */}
        {skipWeeks.length === 0 ? (
          <p className="text-sm text-gray-400">
            Belum ada minggu skip. Semua minggu dihitung berurutan.
          </p>
        ) : (
          <ul className="space-y-2">
            {skipWeeks.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium shrink-0">
                    SKIP
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {fmtTanggal(d)}
                  </span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    ({d})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveSkip(d)}
                  disabled={skipLoading}
                  className="flex items-center gap-1 text-red-400 hover:text-red-600 transition shrink-0 disabled:opacity-50"
                  title="Hapus"
                >
                  <FiTrash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* UPLOAD KALENDER AKADEMIK */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <h2 className="font-semibold mb-2">Upload Kalender Akademik</h2>
        <p className="text-sm text-gray-400 mb-4">
          Upload kalender akademik dalam format PDF. Maksimal 1 file.
        </p>

        <label className="border-2 border-dashed border-blue-300 rounded-xl p-6 sm:p-10 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50 transition">
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
            accept=".pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* File info + tombol hapus */}
            <div className="flex items-center gap-4 bg-gray-50 border rounded-lg px-4 py-3">
              <div className="flex-shrink-0">{getFileIcon(files[0].name)}</div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium text-gray-700 truncate">
                  {files[0].name}
                </p>
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
            <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">Hanya mendukung file .pdf</p>

        <button
          onClick={handleSubmit}
          disabled={!fileReady || loading}
          className={`mt-4 px-6 py-2 rounded-lg text-white transition ${
            !fileReady || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
