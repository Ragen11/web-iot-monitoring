import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiChevronRight, FiArrowLeft, FiMaximize2 } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu...",
  chunking: "Memecah audio...",
  processing: "Memproses...",
  transcribed: "Transkrip selesai...",
  summarizing: "Membuat ringkasan...",
  done: "Selesai",
  failed: "Gagal",
};

// Rapikan label aktivitas dominan dari backend (mis. "DISKUSI & TANYA JAWAB")
const formatDominant = (raw: any): string => {
  if (!raw) return "-";
  const v = String(raw).toUpperCase();
  if (v.includes("DISKUSI") || v.includes("TANYA")) return "Diskusi & Tanya Jawab";
  if (v.includes("CERAMAH")) return "Ceramah";
  if (v.includes("DIAM")) return "Diam";
  return String(raw);
};

export default function DetailMonitoring() {
  const { state } = useLocation();
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [data, setData] = useState<any>(state || null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    const el = videoWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch((err) =>
        console.error("Fullscreen error:", err)
      );
    }
  };

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/${id}`)
      .then((res) => {
        const m = res.data;

        // Sumber breakdown aktivitas: backend bisa kirim sebagai
        // m.activity_stats (objek) ATAU langsung field di m. Handle keduanya.
        const stats = m.activity_stats || m.aktivitas_stats || null;

        const pickPct = (obj: any, ...keys: string[]) => {
          for (const k of keys) {
            const v = obj?.[k];
            if (v !== null && v !== undefined && v !== "") return Number(v);
          }
          return null;
        };

        const aktivitasDetail = (() => {
          const src = stats || m;
          const ceramah    = pickPct(src, "ceramah_pct", "ceramah");
          const tanyaJawab = pickPct(src, "tanya_jawab_pct", "tanyaJawab", "tanya_jawab");
          const diskusi    = pickPct(src, "diskusi_pct", "diskusi");
          const diam       = pickPct(src, "diam_pct", "diam", "tidak_ada_pct");
          const dominant   = src?.dominant_activity || src?.aktivitas_dominan || m.aktivitas_dominan || null;

          // Dianggap "ada data" kalau minimal salah satu persen terisi
          const hasData =
            [ceramah, tanyaJawab, diskusi, diam].some((v) => v !== null);

          if (!hasData) return null;
          return {
            dominant,
            ceramah:    ceramah    ?? 0,
            tanyaJawab: tanyaJawab ?? 0,
            diskusi:    diskusi    ?? 0,
            diam:       diam       ?? 0,
          };
        })();

        const formatted = {
          id: m.id,

          // Mata kuliah
          matkul: m.jadwal_kuliah?.mata_kuliah || "-",
          kode: m.jadwal_kuliah?.kode_mata_kuliah || "-",

          // Jadwal
          hari: m.jadwal_kuliah?.hari || "-",

          // Pertemuan ke
          pertemuan_ke: m.pertemuan_ke ?? stats?.pertemuan_ke ?? null,

          // TANGGAL WAJIB ADA
          tanggal: m.tanggal || m.created_at?.split("T")[0] || "",

          // JAM WAJIB ADA
          jam: m.jadwal_kuliah?.jam_mulai || "",

          jamDisplay: `${m.jadwal_kuliah?.jam_mulai?.slice(
            0,
            5
          )} - ${m.jadwal_kuliah?.jam_selesai?.slice(0, 5)}`,

          ruangan: m.jadwal_kuliah?.ruangan || "-",

          // DOSEN
          kodeDosen: m.jadwal_kuliah?.dosen_utama || "-",
          namaDosen: m.jadwal_kuliah?.dosen_utama || "-",

          // KELAS WAJIB ADA
          kelas: m.jadwal_kuliah?.kelas || "-",

          // Monitoring
          kehadiran: m.kehadiran || "-",
          aktivitas: m.aktivitas_dominan || "-",

          // Breakdown aktivitas (null kalau belum ada data)
          aktivitasDetail,

          // Video
          video_url: m.video_url || "",
        };

        console.log("DETAIL DATA:", formatted);

        setData(formatted);
      })
      .catch((err) => {
        console.error("Error fetch detail monitoring:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, API_URL]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;

    const handleScroll = () => {
      html.classList.add("page-scrolling");

      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      scrollTimerRef.current = setTimeout(() => {
        html.classList.remove("page-scrolling");
      }, 800);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      html.classList.remove("page-scrolling");

      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const subscribeToReport = (reportId: number) => {
    return new Promise<void>((resolve, reject) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`report-${reportId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "reports",
            filter: `id=eq.${reportId}`,
          },
          (payload) => {
            const newStatus = payload.new.status;

            console.log("Realtime Status:", newStatus);

            setCurrentStatus(newStatus);

            if (newStatus === "done") {
              supabase.removeChannel(channel);
              channelRef.current = null;
              resolve();
            }

            if (newStatus === "failed") {
              supabase.removeChannel(channel);
              channelRef.current = null;

              reject(
                new Error(
                  payload.new.error_message || "Proses generate gagal"
                )
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            reject(err || new Error("Realtime connection failed"));
          }
        });

      channelRef.current = channel;
    });
  };

  const handleGenerate = async () => {
    try {
      setLoadingReport(true);
      setPdfUrl("");
      setCurrentStatus("pending");

      // VALIDASI DATA
      if (
        !data?.tanggal ||
        !data?.jam ||
        !data?.ruangan ||
        !data?.kode ||
        !data?.kodeDosen ||
        !data?.kelas
      ) {
        throw new Error(
          "Data generate report belum lengkap"
        );
      }

      // PAYLOAD SESUAI BACKEND
      const payload = {
        tanggal: data.tanggal,
        jam: data.jam,
        ruangan: data.ruangan,
        matkul: data.kode,
        dosen: data.kodeDosen,
        kelas: data.kelas,
      };

      console.log("GENERATE PAYLOAD:", payload);

      // GENERATE REPORT
      const res = await axios.post(
        `${API_URL}/generate-report`,
        payload
      );

      console.log("GENERATE RESPONSE:", res.data);

      const status = res.data.status;

      const allowedStatus = [
        "success",
        "processing",
        "processing_summary",
      ];

      if (!allowedStatus.includes(status)) {
        throw new Error(
          res.data.message || "Generate report gagal"
        );
      }

      // PDF langsung tersedia
      if (status === "success" && res.data.url) {
        setPdfUrl(res.data.url);
        setCurrentStatus("done");
        return;
      }

      // REPORT ID
      const reportId = res.data.report_id;

      if (!reportId) {
        throw new Error("Report ID tidak ditemukan");
      }

      // CHECK STATUS AWAL
      const initialStatus = await axios.get(
        `${API_URL}/report-status/${reportId}`
      );

      console.log(
        "INITIAL STATUS:",
        initialStatus.data
      );

      const currentDbStatus =
        initialStatus.data.report_status;

      if (currentDbStatus === "done") {
        setCurrentStatus("done");
      } else if (currentDbStatus === "failed") {
        throw new Error(
          initialStatus.data.error_message ||
            "Proses gagal"
        );
      } else {
        setCurrentStatus(currentDbStatus);

        // SUBSCRIBE REALTIME
        await subscribeToReport(reportId);
      }

      // GET SUMMARY PDF
      const summaryRes = await axios.get(
        `${API_URL}/summary/${reportId}`
      );

      console.log("SUMMARY RESPONSE:", summaryRes.data);

      if (summaryRes.data.status === "success") {
        setPdfUrl(summaryRes.data.url);
      } else {
        throw new Error(
          summaryRes.data.message ||
            "Summary belum tersedia"
        );
      }
    } catch (err: any) {
      console.error("GENERATE ERROR:", err);

      console.error(
        "ERROR RESPONSE:",
        err?.response?.data
      );

      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.detail?.[0]?.msg ||
          err?.message ||
          "Terjadi kesalahan"
      );
    } finally {
      setLoadingReport(false);

      setTimeout(() => {
        setCurrentStatus("");
      }, 1000);
    }
  };

  // Tampilan error hanya jika fetch selesai tapi data null
  if (!loading && !data) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/monitoring")}
          className="text-sm text-gray-400 hover:text-primary flex items-center gap-1 mb-3"
        >
          <FiArrowLeft size={13} /> Hasil Monitoring
        </button>
        <p className="text-red-500">Data monitoring tidak ditemukan</p>
      </div>
    );
  }

  // Helper untuk skeleton block
  const Sk = ({ className = "" }: { className?: string }) => (
    <span className={`inline-block animate-pulse bg-gray-200 rounded ${className}`} />
  );

  return (
    <div className="p-4 sm:p-6">

      {/* BREADCRUMB — selalu tampil */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-3">
        <button
          onClick={() => navigate("/monitoring")}
          className="hover:text-primary transition flex items-center gap-1"
        >
          <FiArrowLeft size={13} />
          Hasil Monitoring
        </button>
        <FiChevronRight size={12} />
        <span className="text-gray-600 font-medium truncate max-w-[200px]">
          {data?.matkul || data?.kode || (loading ? <Sk className="h-3 w-24 align-middle" /> : "Detail")}
        </span>
      </div>

      {/* HEADER — selalu tampil */}
      <div className="flex items-center mb-6">
        <h1 className="text-xl font-semibold">Detail Monitoring</h1>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm space-y-6">

        {/* SECTION 1: DETAIL KELAS — pakai data dari state instan, skeleton hanya jika belum ada apa-apa */}
        <div>
          <h2 className="font-semibold mb-4">Detail Kelas</h2>

          {data ? (
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-y-2 text-sm">
              <p>Mata Kuliah</p>
              <p>: {data.matkul} {data.kode && `(${data.kode})`}</p>

              <p>Hari</p>
              <p>: {data.hari || "-"}</p>

              <p>Tanggal</p>
              <p>: {data.tanggal || "-"}</p>

              <p>Minggu</p>
              <p>: {data.pertemuan_ke != null ? `Minggu ${data.pertemuan_ke}` : "-"}</p>

              <p>Jam</p>
              <p>: {data.jamDisplay || data.jam || "-"}</p>

              <p>Ruangan</p>
              <p>: {data.ruangan || "-"}</p>

              <p>Kelas</p>
              <p>: {data.kelas || "-"}</p>

              <p>Kode Dosen</p>
              <p>: {data.kodeDosen || "-"}</p>

              <p>Nama Dosen</p>
              <p>: {data.namaDosen || data.kodeDosen || "-"}</p>

              <p>Kehadiran</p>
              <p>: {loading && !data.kehadiran ? <Sk className="h-3 w-20 align-middle" /> : (data.kehadiran || "-")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-y-3 text-sm">
              {Array.from({ length: 20 }).map((_, i) => (
                <Sk key={i} className={i % 2 === 0 ? "h-3 w-20" : "h-3 w-40"} />
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: AKTIVITAS — breakdown persentase */}
        <div>
          <p className="mb-2 text-sm">Aktivitas Kelas</p>

          {loading ? (
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Sk className="h-3 w-28" />
                  <Sk className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : data?.aktivitasDetail ? (
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl space-y-3">
              {/* Aktivitas Dominan */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-500">Aktivitas Dominan</span>
                <span className="text-sm font-semibold text-primary">
                  {formatDominant(data.aktivitasDetail.dominant)}
                </span>
              </div>

              {/* Breakdown per aktivitas */}
              {[
                { label: "Ceramah",               value: data.aktivitasDetail.ceramah, color: "bg-purple-500" },
                { label: "Diskusi & Tanya Jawab", value: data.aktivitasDetail.diskusi + data.aktivitasDetail.tanyaJawab, color: "bg-red-400" },
                { label: "Diam",                  value: data.aktivitasDetail.diam,    color: "bg-gray-400" },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-medium text-gray-700">{row.value}%</span>
                  </div>
                  {/* Progress bar tipis */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`${row.color} h-1.5 rounded-full transition-all`}
                      style={{ width: `${Math.min(row.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Handler: data aktivitas belum tersedia
            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <p className="text-sm text-gray-400">
                Data aktivitas belum tersedia
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Aktivitas akan muncul setelah video sesi ini selesai dianalisis.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 3: VIDEO — skeleton saat loading */}
        <div>
          <p className="mb-2 text-sm">Video Monitoring</p>

          {loading ? (
            <div className="w-full max-w-3xl aspect-video bg-gray-200 rounded-lg animate-pulse" />
          ) : data?.video_url ? (
            <div
              ref={videoWrapRef}
              className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden relative group"
            >
              <iframe
                src={data.video_url}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title="Video Monitoring"
              />
              {/* Tombol fullscreen overlay (sudut kanan bawah) */}
              <button
                onClick={handleFullscreen}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                title="Fullscreen"
              >
                <FiMaximize2 size={16} />
              </button>
            </div>
          ) : (
            <div className="w-full max-w-3xl aspect-video bg-gray-200 flex items-center justify-center rounded-lg text-sm text-gray-500">
              Tidak ada video
            </div>
          )}
        </div>

        {/* PDF */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <p className="text-sm font-medium">
              Preview Laporan
            </p>

            <button
              onClick={handleGenerate}
              disabled={loadingReport}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm transition w-full sm:w-auto justify-center ${
                loadingReport
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              {loadingReport && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}

              {loadingReport
                ? STATUS_LABEL[currentStatus] ||
                  "Processing..."
                : "Generate Laporan"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#zoom=100`}
                className="w-full h-[700px] sm:h-[900px] lg:h-[1100px]"
                title="PDF Laporan"
              />
            ) : (
              <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-gray-400 text-sm">
                Klik "Generate Laporan" untuk membuat
                laporan sesi ini
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}