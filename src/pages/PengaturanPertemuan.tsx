import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiX,
  FiUploadCloud,
  FiFile,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { BsFiletypePdf } from "react-icons/bs";
import { useTahunAjaran } from "../context/TahunAjaranContext";
import {
  SEMESTER_START_DATE,
  SKIP_WEEKS,
  calculateMingguKe,
  isSkipWeek,
} from "../lib/semester";

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
  const taAktifId = aktif?.id;

  // Info minggu saat ini (dihitung dari konfigurasi semester)
  const now    = new Date();
  const today  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const minggu = calculateMingguKe(today);
  const skip   = isSkipWeek(today);
  const mingguLabel = skip
    ? "Minggu SKIP"
    : minggu !== null
    ? `Minggu ke-${minggu}`
    : "Di luar jadwal perkuliahan";

  const fmtTanggal = (val: string) =>
    new Date(val).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── FILE HANDLING ───────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    setFiles([selectedFiles[0]]);
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
    if (taAktifId) formData.append("tahun_ajaran_id", taAktifId);

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

      console.log("UPLOAD KALENDER:", response.data);
      toast.success(response.data?.message || "Upload kalender akademik berhasil!");

      // reset upload
      setFiles([]);
      setProgress(0);
      setFileReadProgress(0);
      setFileReady(false);
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
              {fmtTanggal(SEMESTER_START_DATE)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Minggu libur (skip)</span>
            <span className="font-medium text-gray-700 text-right">
              {SKIP_WEEKS.length > 0
                ? SKIP_WEEKS.map((d) => fmtTanggal(d)).join(", ")
                : "—"}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          <FiCalendar className="inline mb-0.5 mr-1" size={12} />
          Saat ini awal semester &amp; minggu libur masih dikonfigurasi statis.
          Upload kalender akademik di bawah agar sistem dapat menyesuaikan
          perhitungan minggu secara otomatis.
        </p>
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
            Max 10 MB files are allowed
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
