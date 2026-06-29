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
  FiPlusCircle,
  FiPlus,
  FiEdit3,
} from "react-icons/fi";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  BsFiletypeXlsx,
  BsFiletypePdf,
  BsFiletypeTxt,
} from "react-icons/bs";
import { useTahunAjaran } from "../context/TahunAjaranContext";

// Batas ukuran file upload: 1 MB
const MAX_FILE_BYTES = 1 * 1024 * 1024;

type RPSItem = {
  id?: number;
  kode_matkul: string;
  pertemuan_ke: number;
  materi_pembelajaran: string;
  pengalaman_pembelajaran_mahasiswa?: string;
};

// Satu baris pertemuan pada form input manual RPS
type BulkRow = { pertemuan_ke: string; materi: string; pengalaman: string };
const EMPTY_ROW: BulkRow = { pertemuan_ke: "", materi: "", pengalaman: "" };

// Opsi mata kuliah untuk dropdown (dari jadwal_kuliah)
type MatkulOption = { kode: string; nama: string };

export default function InputRPS() {
  // mode kartu input: "upload" (PDF) atau "manual"
  const [mode, setMode] = useState<"upload" | "manual">("upload");

  // form input manual (satu mata kuliah, banyak pertemuan)
  const [bulkKode, setBulkKode] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([{ ...EMPTY_ROW }]);
  const [savingBulk, setSavingBulk] = useState(false);

  // combobox mata kuliah (dropdown matkul yang sudah ada + boleh ketik baru)
  const [matkulOptions, setMatkulOptions] = useState<MatkulOption[]>([]);
  const [matkulOpen, setMatkulOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

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
  // FETCH daftar mata kuliah (untuk dropdown combobox)
  // Sumber: jadwal_kuliah (distinct kode + nama)
  // ────────────────────────────────────────────
  const fetchMatkulOptions = async () => {
    try {
      const params: any = {};
      if (taId) params.tahun_ajaran_id = taId;
      const res = await axios.get(`${API_URL}/scheduled/jadwal`, { params });
      const rows: any[] = Array.isArray(res.data) ? res.data : [];
      const map = new Map<string, string>();
      for (const r of rows) {
        const kode = (r.kode_mata_kuliah || "").trim();
        if (kode && !map.has(kode)) map.set(kode, (r.mata_kuliah || "").trim());
      }
      const opts = Array.from(map.entries())
        .map(([kode, nama]) => ({ kode, nama }))
        .sort((a, b) => a.kode.localeCompare(b.kode));
      setMatkulOptions(opts);
    } catch (err) {
      console.error("❌ fetch matkul options error:", err);
    }
  };

  useEffect(() => {
    fetchMatkulOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taId]);

  // Tutup dropdown matkul saat klik di luar combobox
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setMatkulOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ────────────────────────────────────────────
  // FILE HANDLING
  // ────────────────────────────────────────────
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
    if (taAktifId) formData.append("tahun_ajaran_id", taAktifId);

    try {
      setLoading(true);
      setProgress(0);

      const response = await axios.post(
        `${API_URL}/rps/upload-pdf`,
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

      const { message } = response.data || {};
      toast.success(message || "Upload RPS berhasil!");

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

  // ────────────────────────────────────────────
  // INPUT MANUAL — kirim satu pertemuan ke POST /rps (upsert)
  // ────────────────────────────────────────────
  const postOneRps = (kodeMatkul: string, pertemuan: number, materi: string, pengalaman: string) => {
    const payload: any = {
      kodeMatkul,
      pertemuan,
      materi,
      pengalaman,
    };
    // Backend yang mendukung TA akan menandai; yang tidak akan mengabaikan field ini.
    if (taId) payload.tahun_ajaran_id = taId;
    else if (taAktifId) payload.tahun_ajaran_id = taAktifId;
    return axios.post(`${API_URL}/rps`, payload);
  };

  // ── Tambah / hapus / ubah baris pertemuan ──
  const addBulkRow = () => setBulkRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeBulkRow = (idx: number) =>
    setBulkRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) =>
    setBulkRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const handleSubmitBulk = async () => {
    const kode = bulkKode.trim();
    if (!kode) return toast.error("Kode mata kuliah wajib diisi");

    // Validasi & kumpulkan baris yang terisi
    const valid: { pertemuan: number; materi: string; pengalaman: string }[] = [];
    const seen = new Set<number>();
    for (let i = 0; i < bulkRows.length; i++) {
      const r = bulkRows[i];
      const hasAny = r.pertemuan_ke.trim() || r.materi.trim() || r.pengalaman.trim();
      if (!hasAny) continue; // lewati baris kosong total

      const p = parseInt(r.pertemuan_ke, 10);
      if (!r.pertemuan_ke || isNaN(p) || p < 1)
        return toast.error(`Baris ${i + 1}: pertemuan ke- harus angka minimal 1`);
      if (!r.materi.trim())
        return toast.error(`Baris ${i + 1}: materi pembelajaran wajib diisi`);
      if (seen.has(p))
        return toast.error(`Pertemuan ke-${p} terisi lebih dari sekali`);
      seen.add(p);
      valid.push({ pertemuan: p, materi: r.materi.trim(), pengalaman: r.pengalaman.trim() });
    }

    if (valid.length === 0)
      return toast.error("Isi minimal satu baris pertemuan");

    try {
      setSavingBulk(true);
      const results = await Promise.allSettled(
        valid.map((v) => postOneRps(kode, v.pertemuan, v.materi, v.pengalaman))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;

      if (ok > 0) {
        toast.success(`${ok} pertemuan RPS untuk ${kode} berhasil disimpan`);
        setExpanded((prev) => ({ ...prev, [kode]: true }));
        fetchRPS();
      }
      if (fail > 0) toast.error(`${fail} pertemuan gagal disimpan`);

      // Reset hanya jika semua sukses
      if (fail === 0) {
        setBulkKode("");
        setBulkRows([{ ...EMPTY_ROW }]);
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan RPS");
    } finally {
      setSavingBulk(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") return <BsFiletypeXlsx size={40} className="text-emerald-600" />;
    if (ext === "pdf") return <BsFiletypePdf size={40} className="text-red-500" />;
    if (ext === "txt") return <BsFiletypeTxt size={40} className="text-gray-500" />;
    return <FiFile size={40} className="text-gray-400" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Input RPS</h1>

      {/* UPLOAD / MANUAL CARD */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">

        {/* TAB SWITCHER */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "upload"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiUploadCloud size={16} />
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "manual"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiEdit3 size={16} />
            Input Manual
          </button>
        </div>

      {mode === "upload" && (
        <>
        <h2 className="font-semibold mb-2">Media Upload</h2>

        <p className="text-sm text-gray-400 mb-4">
          Upload data RPS dalam format PDF. Maksimal 1 file.
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
          Hanya mendukung file .pdf. Sistem akan mengekstrak data RPS secara
          otomatis dari PDF.
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
        </>
      )}

      {/* ============ MODE: INPUT MANUAL ============ */}
      {mode === "manual" && (
        <>
          <h2 className="font-semibold mb-1">Input Manual RPS</h2>
          <p className="text-sm text-gray-400 mb-4">
            Pilih mata kuliah, lalu tambahkan pertemuan beserta materinya.
          </p>

          <div className="space-y-4">
            {/* MATA KULIAH — combobox: pilih yang sudah ada atau ketik baru */}
            <div className="flex flex-col gap-1 sm:max-w-md" ref={comboRef}>
              <label className="text-xs font-medium text-gray-600">Mata Kuliah</label>
              <div className="relative">
                <input
                  type="text"
                  value={bulkKode}
                  onChange={(e) => {
                    setBulkKode(e.target.value);
                    setMatkulOpen(true);
                  }}
                  onFocus={() => setMatkulOpen(true)}
                  placeholder="Pilih dari daftar atau ketik kode baru"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMatkulOpen((o) => !o)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiChevronDown
                    size={16}
                    className={`transition-transform ${matkulOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {matkulOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-100 shadow-lg rounded-xl p-1.5 max-h-60 overflow-y-auto">
                    {(() => {
                      const q = bulkKode.trim().toLowerCase();
                      const filtered = q
                        ? matkulOptions.filter(
                            (o) =>
                              o.kode.toLowerCase().includes(q) ||
                              o.nama.toLowerCase().includes(q)
                          )
                        : matkulOptions;
                      const exact = matkulOptions.some(
                        (o) => o.kode.toLowerCase() === q
                      );
                      return (
                        <>
                          {filtered.length === 0 && (
                            <p className="px-3 py-2 text-sm text-gray-400">
                              {matkulOptions.length === 0
                                ? "Belum ada data mata kuliah"
                                : "Tidak ada yang cocok"}
                            </p>
                          )}
                          {filtered.map((o) => (
                            <button
                              key={o.kode}
                              type="button"
                              onClick={() => {
                                setBulkKode(o.kode);
                                setMatkulOpen(false);
                              }}
                              className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              <span className="font-mono text-sm text-gray-700 shrink-0">
                                {o.kode}
                              </span>
                              {o.nama && (
                                <span className="text-xs text-gray-400 truncate">
                                  {o.nama}
                                </span>
                              )}
                            </button>
                          ))}
                          {q && !exact && (
                            <button
                              type="button"
                              onClick={() => setMatkulOpen(false)}
                              className="w-full flex items-center gap-2 text-left px-3 py-2 mt-1 rounded-lg text-primary text-sm hover:bg-primary/5 border-t border-gray-100"
                            >
                              <FiPlus size={14} />
                              Tambah baru:{" "}
                              <span className="font-mono font-medium">
                                {bulkKode.trim()}
                              </span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Pilih mata kuliah yang sudah ada, atau ketik kode baru untuk menambah.
              </p>
            </div>

            {/* Daftar baris pertemuan */}
            <div className="space-y-3">
                {bulkRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="relative border border-gray-100 rounded-xl p-3 bg-gray-50/60"
                  >
                    <div className="flex items-start gap-3">
                      {/* nomor pertemuan */}
                      <div className="flex flex-col gap-1 w-20 shrink-0">
                        <label className="text-[11px] font-medium text-gray-500">Pertemuan</label>
                        <input
                          type="number"
                          min={1}
                          value={row.pertemuan_ke}
                          onChange={(e) => updateBulkRow(idx, "pertemuan_ke", e.target.value)}
                          placeholder={`${idx + 1}`}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>

                      {/* materi + pengalaman */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-gray-500">Materi Pembelajaran</label>
                          <textarea
                            rows={2}
                            value={row.materi}
                            onChange={(e) => updateBulkRow(idx, "materi", e.target.value)}
                            placeholder="Materi pertemuan ini"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-gray-500">
                            Pengalaman Pembelajaran <span className="text-gray-300">(opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={row.pengalaman}
                            onChange={(e) => updateBulkRow(idx, "pengalaman", e.target.value)}
                            placeholder="Contoh: 1 x 50 menit"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* hapus baris */}
                      <button
                        type="button"
                        onClick={() => removeBulkRow(idx)}
                        disabled={bulkRows.length === 1}
                        title="Hapus baris"
                        className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* tambah baris */}
              <button
                type="button"
                onClick={addBulkRow}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition"
              >
                <FiPlus size={15} />
                Tambah Pertemuan
              </button>

              <div className="pt-1">
                <button
                  onClick={handleSubmitBulk}
                  disabled={savingBulk}
                  className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white transition ${
                    savingBulk ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
                  }`}
                >
                  <FiPlusCircle size={16} />
                  {savingBulk ? "Menyimpan..." : "Simpan Semua Pertemuan"}
                </button>
              </div>
            </div>
        </>
      )}
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
