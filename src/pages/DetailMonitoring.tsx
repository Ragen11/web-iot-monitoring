import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
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

export default function DetailMonitoring() {
  const { state } = useLocation();
  const { id } = useParams();

  const [data, setData] = useState<any>(state || null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // =========================
  // FETCH DETAIL MONITORING
  // =========================
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/${id}`)
      .then((res) => {
        const m = res.data;

        const formatted = {
          id: m.id,

          // Mata kuliah
          matkul: m.jadwal_kuliah?.mata_kuliah || "-",
          kode: m.jadwal_kuliah?.kode_mata_kuliah || "-",

          // Jadwal
          hari: m.jadwal_kuliah?.hari || "-",

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

  // =========================
  // CLEANUP REALTIME
  // =========================
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // =========================
  // AUTO HIDE SCROLLBAR
  // =========================
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

  // =========================
  // REALTIME REPORT STATUS
  // =========================
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

  // =========================
  // GENERATE REPORT
  // =========================
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

      alert(
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

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  // =========================
  // DATA TIDAK ADA
  // =========================
  if (!data) {
    return (
      <p className="p-6 text-red-500">
        Data monitoring tidak ditemukan
      </p>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center mb-6">
        <h1 className="text-xl font-semibold">
          Hasil Monitoring
        </h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
        {/* DETAIL KELAS */}
        <div>
          <h2 className="font-semibold mb-4">
            Detail Kelas
          </h2>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p>Mata Kuliah</p>
            <p>
              : {data.matkul} ({data.kode})
            </p>

            <p>Hari</p>
            <p>: {data.hari}</p>

            <p>Tanggal</p>
            <p>: {data.tanggal}</p>

            <p>Jam</p>
            <p>: {data.jamDisplay}</p>

            <p>Ruangan</p>
            <p>: {data.ruangan}</p>

            <p>Kelas</p>
            <p>: {data.kelas}</p>

            <p>Kode Dosen</p>
            <p>: {data.kodeDosen}</p>

            <p>Nama Dosen</p>
            <p>: {data.namaDosen}</p>

            <p>Kehadiran</p>
            <p>: {data.kehadiran}</p>
          </div>
        </div>

        {/* AKTIVITAS */}
        <div>
          <p className="mb-2 text-sm">
            Aktivitas Kelas
          </p>

          <div className="bg-gray-100 p-6 rounded-xl">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-purple-500 w-1/3"></div>

              <div className="bg-red-400 w-1/6"></div>

              <div className="bg-blue-400 w-1/2"></div>
            </div>

            <div className="flex justify-between text-xs mt-2 text-gray-400">
              <span>08.00</span>
              <span>09.00</span>
              <span>09.15</span>
              <span>10.00</span>
            </div>

            <div className="flex gap-4 text-xs mt-3">
              <span className="text-purple-500">
                • Ceramah
              </span>

              <span className="text-red-400">
                • Diskusi
              </span>

              <span className="text-blue-400">
                • Tanya Jawab
              </span>
            </div>
          </div>
        </div>

        {/* VIDEO */}
        <div>
          <p className="mb-2 text-sm">
            Video Monitoring
          </p>

          {data.video_url ? (
            <iframe
              src={data.video_url}
              className="w-[400px] h-[250px] rounded-lg"
              allow="autoplay"
              title="Video Monitoring"
            />
          ) : (
            <div className="w-60 h-40 bg-gray-200 flex items-center justify-center rounded-lg">
              Tidak ada video
            </div>
          )}
        </div>

        {/* PDF */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              Preview Laporan
            </p>

            <button
              onClick={handleGenerate}
              disabled={loadingReport}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm transition ${
                loadingReport
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#A44A4A] hover:bg-[#8f3e3e]"
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
                src={pdfUrl}
                className="w-full h-[600px]"
                title="PDF Laporan"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
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