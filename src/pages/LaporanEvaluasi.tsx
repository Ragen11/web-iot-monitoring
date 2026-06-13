import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import FilterDropdown, { type FilterOption } from "../components/FilterDropdown";
import { useTahunAjaran } from "../context/TahunAjaranContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABEL: Record<string, string> = {
  pending:    "Menunggu antrian...",
  processing: "Memproses laporan...",
  done:       "Selesai",
  failed:     "Gagal",
};

type DosenItem  = { kode_dosen: string; nama_lengkap: string };
type PeriodeOpt = { value: string; label: string };
type MatkulInfo = {
  kode_matkul:    string;
  nama_matkul:    string;
  total_tersedia: number;
  pertemuan:      number[];
  pra_uts:        number[];  
  pasca_uts:      number[];  
};
type EvalItem   = {
  id: number;
  kode_dosen: string;
  periode: string;
  status: string;
  pdf_url?: string | null;
  error_message?: string | null;
  created_at: string;
};
type KelasSummary = {
  kode_matkul:               string;
  nama_matkul:               string;
  kelas:                     string;
  kode_dosen:                string;
  nama_dosen:                string;
  ketepatan_materi:          number | null;
  ketepatan_waktu_mengajar:  number | null;
  total_pertemuan:           number;
  dinilai_materi:            number;
  pertemuan_dihitung:        number;
  durasi_aktual_total:       number;
  durasi_harapan_total:      number;
  durasi_harapan_per_pertemuan: number | null;
};
type DosenPerforma = {
  kode_dosen:                string;
  nama_dosen:                string;
  performa:                  number | null;
  ketepatan_materi:          number | null;
  ketepatan_waktu_mengajar:  number | null;
};

// ── Komponen status ketersediaan pertemuan ────────────────────────────────────
function PrereqStatus({ prereq, periodeLabel }: { prereq: any; periodeLabel: string }) {
  const available = (prereq.available ?? {}) as Record<string, number[]>;
  const missing   = (prereq.missing   ?? {}) as Record<string, number[]>;

  // Gabung semua kode matkul dari kedua sisi
  const allKodes = [...new Set([...Object.keys(available), ...Object.keys(missing)])];

  const isAll     = prereq.can_generate === true;
  const isPartial = !isAll && prereq.can_partial === true;
  // isNone = !isAll && !isPartial

  const wrapClass = isAll
    ? "bg-green-50 border-green-200 text-green-800"
    : isPartial
    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
    : "bg-red-50 border-red-200 text-red-700";

  const headline = isAll
    ? "✓ Semua pertemuan tersedia. Laporan siap dibuat."
    : isPartial
    ? "⚠️ Laporan akan dibuat berdasarkan pertemuan yang tersedia."
    : "❌ Belum ada laporan identifikasi yang selesai untuk periode ini.";

  return (
    <div className={`border rounded-xl p-3 space-y-2 ${wrapClass}`}>
      <p className="text-xs font-medium">{headline}</p>

      {/* Tabel ketersediaan per matkul */}
      {allKodes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">
            Ketersediaan data — {periodeLabel}:
          </p>
          {allKodes.map((kode) => {
            const avail = available[kode] ?? [];
            const miss  = missing[kode]   ?? [];
            return (
              <div key={kode} className="flex items-baseline gap-3 text-xs">
                <span className="font-mono font-semibold w-24 shrink-0">{kode}</span>
                <span className="flex flex-wrap gap-x-3">
                  {avail.length > 0 && (
                    <span className="text-green-700">
                      ✓ Mg {avail.join(", ")}
                    </span>
                  )}
                  {miss.length > 0 && (
                    <span className="text-red-500">
                      ✗ Belum: {miss.join(", ")}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LaporanEvaluasi() {
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  // Tabel ringkasan ketepatan per kelas
  const [kelasSummary, setKelasSummary] = useState<KelasSummary[]>([]);
  const [kelasLoading, setKelasLoading] = useState(true);

  // Tabel performa dosen
  const [dosenPerforma, setDosenPerforma]     = useState<DosenPerforma[]>([]);
  const [dosenPerfLoading, setDosenPerfLoading] = useState(true);

  // Options untuk dropdown
  const [dosenList,      setDosenList]      = useState<DosenItem[]>([]);
  const [periodeOptions, setPeriodeOptions] = useState<PeriodeOpt[]>([]);

  // Filter yang dipilih user
  const [filterDosen,   setFilterDosen]   = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");

  // Info matkul dosen (fetch saat dosen dipilih)
  const [matkulInfo,        setMatkulInfo]        = useState<MatkulInfo[]>([]);
  const [matkulInfoLoading, setMatkulInfoLoading] = useState(false);

  // Prerequisite check
  const [prereq,        setPrereq]        = useState<any>(null);
  const [prereqLoading, setPrereqLoading] = useState(false);

  // Generate state
  const [loading,       setLoading]       = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [pdfUrl,        setPdfUrl]        = useState("");

  // Riwayat laporan
  const [history, setHistory] = useState<EvalItem[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch dosen + periode options saat mount ─────────────────────────────
  useEffect(() => {
    axios
      .get(`${API}/evaluation/dosen`)
      .then((res) => setDosenList(res.data?.data ?? []))
      .catch((err) => console.error("❌ fetch dosen:", err));

    axios
      .get(`${API}/evaluation/periode-options`)
      .then((res) => setPeriodeOptions(res.data?.data ?? []))
      .catch((err) => console.error("❌ fetch periode:", err));
  }, []);

  // ── Fetch tabel ringkasan kelas (ikut Tahun Ajaran aktif) ─────────────────
  useEffect(() => {
    setKelasLoading(true);
    const params: any = {};
    if (taId) params.tahun_ajaran_id = taId;
    axios
      .get(`${API}/evaluation/kelas-summary`, { params })
      .then((res) => setKelasSummary(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("❌ fetch kelas-summary:", err);
        setKelasSummary([]);
      })
      .finally(() => setKelasLoading(false));
  }, [taId]);

  // ── Fetch tabel performa dosen (ikut Tahun Ajaran aktif) ──────────────────
  useEffect(() => {
    setDosenPerfLoading(true);
    const params: any = {};
    if (taId) params.tahun_ajaran_id = taId;
    axios
      .get(`${API}/evaluation/dosen-performa`, { params })
      .then((res) => setDosenPerforma(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("❌ fetch dosen-performa:", err);
        setDosenPerforma([]);
      })
      .finally(() => setDosenPerfLoading(false));
  }, [taId]);

  // ── Fetch info matkul saat dosen berubah ─────────────────────────────────
  useEffect(() => {
    if (!filterDosen) { setMatkulInfo([]); return; }
    setMatkulInfoLoading(true);
    axios
      .get(`${API}/evaluation/matkul-info`, { params: { kode_dosen: filterDosen } })
      .then((res) => setMatkulInfo(res.data?.data ?? []))
      .catch((err) => console.error("❌ fetch matkul-info:", err))
      .finally(() => setMatkulInfoLoading(false));
  }, [filterDosen]);

  // ── Prerequisite check saat dosen + periode berubah ──────────────────────
  useEffect(() => {
    if (!filterDosen || !filterPeriode) {
      setPrereq(null);
      return;
    }
    setPrereqLoading(true);
    axios
      .get(`${API}/evaluation/prerequisite-check`, {
        params: { kode_dosen: filterDosen, periode: filterPeriode },
      })
      .then((res) => setPrereq(res.data))
      .catch((err) => console.error("❌ prereq check:", err))
      .finally(() => setPrereqLoading(false));
  }, [filterDosen, filterPeriode]);

  // ── Fetch riwayat laporan ─────────────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const params: any = { limit: 20 };
      if (filterDosen) params.kode_dosen = filterDosen;
      const res = await axios.get(`${API}/evaluation/list`, { params });
      setHistory(res.data?.data ?? []);
    } catch (err) {
      console.error("❌ fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDosen]);

  // ── Cleanup polling saat unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (evalId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/evaluation/status/${evalId}`);
        const { process_status, pdf_url, error_message } = res.data;
        setCurrentStatus(process_status);

        if (process_status === "done") {
          stopPolling();
          setPdfUrl(pdf_url ?? "");
          toast.success("Laporan evaluasi berhasil dibuat!");
          setLoading(false);
          fetchHistory();
        } else if (process_status === "failed") {
          stopPolling();
          toast.error(error_message || "Generate laporan gagal");
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ polling error:", err);
      }
    }, 3000);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!filterDosen || !filterPeriode) {
      toast.error("Pilih dosen dan periode terlebih dahulu!");
      return;
    }

    try {
      setLoading(true);
      setPdfUrl("");
      setCurrentStatus("pending");

      const payload: any = {
        kode_dosen: filterDosen,
        periode:    filterPeriode,
      };
      if (taId) payload.tahun_ajaran_id = taId;

      const res = await axios.post(`${API}/evaluation/generate`, payload);
      const evalId = res.data?.eval_id;
      if (!evalId) throw new Error("Eval ID tidak ditemukan dari server");

      toast.info("Generate laporan dimulai, mohon tunggu...");
      startPolling(evalId);
    } catch (err: any) {
      setLoading(false);
      setCurrentStatus("");

      // Detail dari BE bisa string atau object { message, missing }
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.message || err?.message || "Gagal memulai generate";

      toast.error(msg);
    }
  };

  // Generate aktif kalau: dosen + periode dipilih, minimal sebagian data tersedia, tidak loading
  const canGenerate =
    !!filterDosen && !!filterPeriode &&
    (prereq?.can_generate === true || prereq?.can_partial === true) &&
    !loading;

  const buttonLabel = loading
    ? STATUS_LABEL[currentStatus] || "Memproses..."
    : "Generate Laporan";

  // Badge persen dengan warna sesuai nilai
  const pctBadge = (v: number | null) => {
    if (v === null || v === undefined) return <span className="text-gray-300">—</span>;
    let cls = "bg-red-100 text-red-700";
    if (v >= 85) cls = "bg-green-100 text-green-700";
    else if (v >= 70) cls = "bg-yellow-100 text-yellow-700";
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {v}%
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Laporan Evaluasi</h1>

      {/* ── TABEL KELAS — ringkasan ketepatan materi & waktu ───────────────── */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <h2 className="font-semibold text-gray-700 mb-1">Ringkasan Ketepatan per Kelas</h2>
        <p className="text-xs text-gray-400 mb-4">
          Ketepatan materi &amp; waktu dihitung dari laporan yang telah dievaluasi terhadap RPS.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Kode Matkul</th>
                <th className="pb-2 font-medium">Kelas</th>
                <th className="pb-2 font-medium">Nama Dosen</th>
                <th className="pb-2 font-medium text-center">Ketepatan Materi</th>
                <th className="pb-2 font-medium text-center">Ketepatan Durasi Mengajar</th>
              </tr>
            </thead>
            <tbody>
              {kelasLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                    Memuat data…
                  </td>
                </tr>
              ) : kelasSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                    Belum ada data evaluasi kelas.
                  </td>
                </tr>
              ) : (
                kelasSummary.map((row, i) => (
                  <tr
                    key={`${row.kode_matkul}-${row.kelas}-${row.kode_dosen}-${i}`}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-700 font-mono">{row.kode_matkul}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]" title={row.nama_matkul}>
                        {row.nama_matkul}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700">{row.kelas}</td>
                    <td className="py-2.5 pr-4">
                      <p className="text-gray-700">{row.nama_dosen}</p>
                      <p className="text-xs text-gray-400 font-mono">({row.kode_dosen})</p>
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {pctBadge(row.ketepatan_materi)}
                    </td>
                    <td
                      className="py-2.5 text-center"
                      title={
                        row.ketepatan_waktu_mengajar === null
                          ? "Belum ada data durasi"
                          : `Aktual ${row.durasi_aktual_total} mnt dari harapan ${row.durasi_harapan_total} mnt ` +
                            `(${row.durasi_harapan_per_pertemuan} mnt × ${row.pertemuan_dihitung} pertemuan)`
                      }
                    >
                      {pctBadge(row.ketepatan_waktu_mengajar)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABEL DOSEN — % Performa ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <h2 className="font-semibold text-gray-700 mb-1">Performa Dosen</h2>
        <p className="text-xs text-gray-400 mb-4">
          Gabungan berbobot: Ketepatan Materi 50% · Ketepatan Durasi Mengajar 50%
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Kode Dosen</th>
                <th className="pb-2 font-medium text-center">% Performa</th>
              </tr>
            </thead>
            <tbody>
              {dosenPerfLoading ? (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-gray-400 text-sm">
                    Memuat data…
                  </td>
                </tr>
              ) : dosenPerforma.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-gray-400 text-sm">
                    Belum ada data performa dosen.
                  </td>
                </tr>
              ) : (
                dosenPerforma.map((d) => (
                  <tr
                    key={d.kode_dosen}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-700 font-mono">{d.kode_dosen}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[220px]" title={d.nama_dosen}>
                        {d.nama_dosen}
                      </p>
                    </td>
                    <td
                      className="py-2.5 text-center"
                      title={
                        `Materi ${d.ketepatan_materi ?? "–"}% · ` +
                        `Waktu Mengajar ${d.ketepatan_waktu_mengajar ?? "–"}%`
                      }
                    >
                      {pctBadge(d.performa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FILTER + GENERATE ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-start">

          {/* Dropdown Dosen */}
          <FilterDropdown
            width="w-64"
            label="Pilih Dosen"
            value={filterDosen}
            onChange={(v) => {
              setFilterDosen(v);
              setPdfUrl("");
            }}
            options={dosenList.map<FilterOption>((d) => ({
              value: d.kode_dosen,
              label: `${d.kode_dosen} — ${d.nama_lengkap}`,
            }))}
          />

          {/* Dropdown Periode */}
          <FilterDropdown
            width="w-48"
            label="Pilih Periode"
            value={filterPeriode}
            onChange={(v) => {
              setFilterPeriode(v);
              setPdfUrl("");
            }}
            options={periodeOptions.map<FilterOption>((p) => ({
              value: p.value,
              label: p.label,
            }))}
          />

          {/* Tombol Generate */}
          <button
            disabled={!canGenerate}
            onClick={handleGenerate}
            className={`px-5 py-2 rounded-xl text-sm text-white font-medium transition flex items-center gap-2 ${
              !canGenerate
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:opacity-90"
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {buttonLabel}
          </button>
        </div>

        {/* ── Info Mata Kuliah (tampil saat dosen dipilih) ──────────────────── */}
        {filterDosen && (
          matkulInfoLoading ? (
            <p className="text-xs text-gray-400">Memuat info mata kuliah...</p>
          ) : matkulInfo.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Mata kuliah yang diampu:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matkulInfo.map((mk) => (
                  <div
                    key={mk.kode_matkul}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs space-y-1.5"
                  >
                    {/* Header matkul */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-700">{mk.nama_matkul}</p>
                        <p className="text-gray-400 font-mono">{mk.kode_matkul}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        mk.total_tersedia > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {mk.total_tersedia} laporan
                      </span>
                    </div>

                    {/* Ketersediaan per periode */}
                    <div className="border-t border-gray-100 pt-1.5 space-y-0.5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="w-24 shrink-0 text-gray-400">Pra-UTS (1–7)</span>
                        <span className={mk.pra_uts.length > 0 ? "text-green-700 font-medium" : "text-gray-300"}>
                          {mk.pra_uts.length > 0 ? `Mg ${mk.pra_uts.join(", ")}` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="w-24 shrink-0 text-gray-400">Pasca-UTS (9–15)</span>
                        <span className={mk.pasca_uts.length > 0 ? "text-green-700 font-medium" : "text-gray-300"}>
                          {mk.pasca_uts.length > 0 ? `Mg ${mk.pasca_uts.join(", ")}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Dosen ini belum memiliki mata kuliah atau laporan di semester ini.
            </p>
          )
        )}

        {/* ── Status prerequisite (tampil saat dosen + periode dipilih) ─────── */}
        {filterDosen && filterPeriode && (
          prereqLoading ? (
            <p className="text-xs text-gray-400">Memeriksa kelengkapan data...</p>
          ) : prereq !== null ? (
            <PrereqStatus prereq={prereq} periodeLabel={
              periodeOptions.find((p) => p.value === filterPeriode)?.label ?? filterPeriode
            } />
          ) : null
        )}
      </div>

      {/* ── PDF VIEWER ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-[400px] sm:h-[550px] lg:h-[700px]"
            title="PDF Laporan Evaluasi"
          />
        ) : (
          <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3 text-sm">
            {loading ? (
              <>
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>{STATUS_LABEL[currentStatus] || "Memproses laporan..."}</span>
              </>
            ) : (
              <span>Pilih dosen &amp; periode, lalu klik Generate</span>
            )}
          </div>
        )}
      </div>

      {/* ── RIWAYAT LAPORAN ───────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Riwayat Laporan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Dosen</th>
                  <th className="pb-2 font-medium">Periode</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Dibuat</th>
                  <th className="pb-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-2.5 pr-4">{item.kode_dosen}</td>
                    <td className="py-2.5 pr-4">{item.periode}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "done"
                            ? "bg-green-100 text-green-700"
                            : item.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5">
                      {item.pdf_url ? (
                        <button
                          onClick={() => setPdfUrl(item.pdf_url!)}
                          className="text-primary text-xs hover:underline"
                        >
                          Tampilkan
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
