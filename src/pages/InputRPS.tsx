import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiX,
  FiUploadCloud,
  FiFile,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  BsFiletypeCsv,
  BsFiletypeXlsx,
  BsFiletypePdf,
  BsFiletypeTxt,
} from "react-icons/bs";
import { useTahunAjaran } from "../context/TahunAjaranContext";

type RPSItem = {
  id?: number;
  kode_matkul: string;
  pertemuan_ke: number;
  materi_pembelajaran: string;
  pengalaman_pembelajaran_mahasiswa?: string;
};

export default function InputRPS() {
  // upload state
  const [files, setFiles]                     = useState<File[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [progress, setProgress]               = useState(0);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [fileReady, setFileReady]             = useState(false);

  // list state
  const [rpsList, setRpsList]   = useState<RPSItem[]>([]);
  const [fetching, setFetching] = useState(true);

  // accordion: matkul mana yang sedang dibuka
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleGroup = (kode: string) =>
    setExpanded((prev) => ({ ...prev, [kode]: !prev[kode] }));

  // hapus RPS (satu pertemuan atau seluruh matkul)
  type DeleteTarget =
    | { type: "one"; id: number; label: string }
    | { type: "matkul"; kode: string; label: string };
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRps = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "one") {
        await axios.delete(`${API_URL}/rps/${deleteTarget.id}`);
      } else {
        await axios.delete(`${API_URL}/rps/matkul/${encodeURIComponent(deleteTarget.kode)}`);
      }
      toast.success("Data RPS berhasil dihapus");
      setDeleteTarget(null);
      fetchRPS();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Gagal menghapus RPS"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Kelompokkan RPS per kode_matkul, pertemuan diurutkan menaik
  const groupedRps = useMemo(() => {
    const map = new Map<string, RPSItem[]>();
    for (const item of rpsList) {
      const arr = map.get(item.kode_matkul) ?? [];
      arr.push(item);
      map.set(item.kode_matkul, arr);
    }
    return Array.from(map.entries())
      .map(([kode, items]) => ({
        kode_matkul: kode,
        items: [...items].sort((a, b) => a.pertemuan_ke - b.pertemuan_ke),
      }))
      .sort((a, b) => a.kode_matkul.localeCompare(b.kode_matkul));
  }, [rpsList]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const { selected, aktif } = useTahunAjaran();
  const taId      = selected?.id;
  const taAktifId = aktif?.id;

  // ────────────────────────────────────────────
  // FETCH LIST RPS — filter by TA selected
  // ────────────────────────────────────────────
  const fetchRPS = async () => {
    try {
      setFetching(true);
      const params: any = {};
      if (taId) params.tahun_ajaran_id = taId;
      const res = await axios.get(`${API_URL}/rps`, { params });
      // backend return: { status: "success", data: [...] }
      const list = res.data?.data;
      setRpsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("❌ fetch RPS error:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRPS();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taId]);

  // ────────────────────────────────────────────
  // FILE HANDLING
  // ────────────────────────────────────────────
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

    const lower = file.name.toLowerCase();
    const isCsv = lower.endsWith(".csv");
    const isPdf = lower.endsWith(".pdf");

    if (!isCsv && !isPdf) {
      toast.error("File harus format CSV atau PDF!");
      return;
    }

    // Pilih endpoint sesuai tipe file
    const endpoint = isPdf ? "/rps/upload-pdf" : "/rps/upload-csv";

    const formData = new FormData();
    formData.append("file", file);
    if (taAktifId) formData.append("tahun_ajaran_id", taAktifId);

    try {
      setLoading(true);
      setProgress(0);

      const response = await axios.post(
        `${API_URL}${endpoint}`,
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

      console.log("UPLOAD RPS:", response.data);

      const { message, skipped, errors: rowErrors } = response.data || {};
      toast.success(message || "Upload RPS berhasil!");

      // tampilkan warning kalau ada baris yg di-skip
      if (skipped && skipped > 0 && Array.isArray(rowErrors)) {
        console.warn("⚠️ Baris yang di-skip:", rowErrors);
        toast.warning(`${skipped} baris di-skip. Cek console untuk detail.`);
      }

      // reset upload
      setFiles([]);
      setProgress(0);
      setFileReadProgress(0);
      setFileReady(false);

      // refresh list
      fetchRPS();
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
    if (ext === "csv") return <BsFiletypeCsv size={40} className="text-green-600" />;
    if (ext === "xlsx" || ext === "xls") return <BsFiletypeXlsx size={40} className="text-emerald-600" />;
    if (ext === "pdf") return <BsFiletypePdf size={40} className="text-red-500" />;
    if (ext === "txt") return <BsFiletypeTxt size={40} className="text-gray-500" />;
    return <FiFile size={40} className="text-gray-400" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Input RPS</h1>

      {/* UPLOAD CARD */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <h2 className="font-semibold mb-2">Media Upload</h2>

        <p className="text-sm text-gray-400 mb-4">
          Upload data RPS dalam format CSV atau PDF. Maksimal 1 file.
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
            accept=".csv,.pdf"
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
            <p className="text-xs text-gray-500 mt-1">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Mendukung file .csv dan .pdf. Untuk CSV, format kolom:{" "}
          <code className="text-gray-500">
            kode_matkul, pertemuan_ke, materi_pembelajaran, pengalaman_pembelajaran_mahasiswa
          </code>
          . Untuk PDF, sistem akan mengekstrak data RPS secara otomatis.
        </p>

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

      {/* LIST DATA RPS */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiBookOpen className="text-primary" size={18} />
          <h2 className="font-semibold text-gray-700">
            Data RPS yang Telah Diinput
          </h2>
        </div>

        {fetching ? (
          <p className="text-sm text-gray-400">Memuat data…</p>
        ) : rpsList.length === 0 ? (
          <p className="text-sm text-gray-400">
            Belum ada data RPS. Silakan upload file CSV atau PDF terlebih dahulu.
          </p>
        ) : (
          <div className="space-y-3">
            {groupedRps.map((group) => {
              const isOpen = !!expanded[group.kode_matkul];
              return (
                <div
                  key={group.kode_matkul}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* HEADER MATKUL */}
                  <div className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.kode_matkul)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-75 transition"
                    >
                      <span className="text-gray-400">
                        {isOpen ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                      </span>
                      <span className="font-semibold text-gray-700 font-mono truncate">
                        {group.kode_matkul}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {group.items.length} pertemuan
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "matkul",
                            kode: group.kode_matkul,
                            label: `semua ${group.items.length} pertemuan ${group.kode_matkul}`,
                          })
                        }
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus semua pertemuan matkul ini"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* ISI PERTEMUAN (saat dibuka) */}
                  {isOpen && (
                    <div className="p-3 space-y-2 bg-white">
                      {group.items.map((item, i) => (
                        <div
                          key={item.id ?? i}
                          className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex gap-3"
                        >
                          {/* BADGE PERTEMUAN */}
                          <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-primary font-medium leading-none">
                              Prt.
                            </span>
                            <span className="text-base font-bold text-primary leading-none">
                              {item.pertemuan_ke}
                            </span>
                          </div>

                          {/* CONTENT */}
                          <div className="flex-1 min-w-0 space-y-1 text-sm">
                            <div>
                              <span className="text-xs text-gray-400">Materi Pembelajaran</span>
                              <p className="text-gray-700 line-clamp-2">
                                {item.materi_pembelajaran}
                              </p>
                            </div>

                            {item.pengalaman_pembelajaran_mahasiswa && (
                              <div>
                                <span className="text-xs text-gray-400">Pengalaman Pembelajaran</span>
                                <p className="text-gray-700 line-clamp-2">
                                  {item.pengalaman_pembelajaran_mahasiswa}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* TOMBOL HAPUS PERTEMUAN */}
                          {item.id != null && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "one",
                                  id: item.id!,
                                  label: `pertemuan ${item.pertemuan_ke} (${group.kode_matkul})`,
                                })
                              }
                              className="shrink-0 self-start p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                              title="Hapus pertemuan ini"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Konfirmasi hapus RPS */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Data RPS"
        message={
          deleteTarget
            ? `Yakin ingin menghapus ${deleteTarget.label}? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
        confirmLabel={deleting ? "Menghapus..." : "Ya, Hapus"}
        onConfirm={handleDeleteRps}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
