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
type EvalItem   = {
  id: number;
  kode_dosen: string;
  periode: string;
  status: string;
  pdf_url?: string | null;
  error_message?: string | null;
  created_at: string;
};

export default function LaporanEvaluasi() {
  const { selected } = useTahunAjaran();
  const taId = selected?.id;

  // Options untuk dropdown
  const [dosenList,      setDosenList]      = useState<DosenItem[]>([]);
  const [periodeOptions, setPeriodeOptions] = useState<PeriodeOpt[]>([]);

  // Filter yang dipilih user
  const [filterDosen,   setFilterDosen]   = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");

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

  // Generate hanya aktif kalau: dosen + periode dipilih, prereq OK, tidak sedang loading
  const canGenerate =
    !!filterDosen && !!filterPeriode && prereq?.can_generate === true && !loading;

  const buttonLabel = loading
    ? STATUS_LABEL[currentStatus] || "Memproses..."
    : "Generate Laporan";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Laporan Evaluasi</h1>

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

        {/* Status prerequisite */}
        {filterDosen && filterPeriode && (
          prereqLoading ? (
            <p className="text-xs text-gray-400">Memeriksa kelengkapan data...</p>
          ) : prereq?.can_generate === true ? (
            <p className="text-xs text-green-600 font-medium">
              ✓ Semua pertemuan sudah siap. Laporan dapat dibuat.
            </p>
          ) : prereq?.can_generate === false ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
              ⚠️ Beberapa pertemuan belum memiliki laporan identifikasi yang selesai.
              Silakan generate ulang laporan identifikasi yang masih kurang terlebih dahulu.
            </div>
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
