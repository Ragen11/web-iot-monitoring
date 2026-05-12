import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiChevronDown } from "react-icons/fi";
import { supabase } from "../lib/supabase"; // 🔥 sesuaikan path
import type { RealtimeChannel } from "@supabase/supabase-js";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu...",
  chunking: "Memecah audio...",
  processing: "Memproses...",
  transcribed: "Transkrip selesai...",
  summarizing: "Membuat ringkasan...",
  done: "Selesai",
  failed: "Gagal",
};

export default function LaporanEvaluasi() {
  const [filters, setFilters] = useState<any>({
    tanggal: "",
    jam: "",
    ruangan: "",
    matkul: "",
    dosen: "",
    kelas: "",
  });

  const [options, setOptions] = useState<any>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  // 🔥 Realtime channel ref
  const channelRef = useRef<RealtimeChannel | null>(null);

  const filterList = ["tanggal", "jam", "ruangan", "matkul", "dosen", "kelas"];

  // =========================
  // TOGGLE FILTER
  // =========================
  const toggleFilter = (name: string) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  // =========================
  // CLOSE DROPDOWN
  // =========================
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // =========================
  // FETCH FILTER OPTIONS
  // =========================
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get(`${API}/filters`, { params: filters });
        setOptions(res.data);
      } catch (err) {
        console.error("Fetch filters failed:", err);
      }
    };
    fetchFilters();
  }, [filters]);

  // =========================
  // 🧹 CLEANUP CHANNEL ON UNMOUNT
  // =========================
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const handleSelect = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  // =========================
  // 🔥 SUBSCRIBE REALTIME
  // =========================
  const subscribeToReport = (reportId: number) => {
    return new Promise<void>((resolve, reject) => {
      // 🛑 Cleanup channel lama kalau ada
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
            const errorMessage = payload.new.error_message;

            console.log("📡 REALTIME STATUS:", newStatus);
            setCurrentStatus(newStatus);

            // ✅ Selesai
            if (newStatus === "done") {
              supabase.removeChannel(channel);
              channelRef.current = null;
              resolve();
            }

            // ❌ Gagal
            if (newStatus === "failed") {
              supabase.removeChannel(channel);
              channelRef.current = null;
              reject(new Error(errorMessage || "Proses gagal"));
            }
          }
        )
        .subscribe((status, err) => {
          console.log("📡 Subscription status:", status);

          if (status === "SUBSCRIBED") {
            console.log("✅ Realtime connected");
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
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
      setLoading(true);
      setPdfUrl("");
      setCurrentStatus("pending");

      const res = await axios.post(`${API}/generate-report`, filters);
      console.log("GENERATE RESPONSE:", res.data);

      const status = res.data.status;
      const allowedStatus = ["success", "processing", "processing_summary"];

      if (!allowedStatus.includes(status)) {
        throw new Error(res.data.message || "Generate report gagal");
      }

      // CACHE HIT
      if (status === "success" && res.data.url) {
        setPdfUrl(res.data.url);
        setCurrentStatus("done");
        return;
      }

      const reportId = res.data.report_id;
      if (!reportId) throw new Error("Report ID tidak ditemukan");

      console.log("REPORT ID:", reportId);

      // 🔥 CEK STATUS AWAL DULU (fallback kalau status sudah berubah sebelum subscribe)
      const initialStatus = await axios.get(`${API}/report-status/${reportId}`);
      const currentDbStatus = initialStatus.data.report_status;

      if (currentDbStatus === "done") {
        setCurrentStatus("done");
      } else if (currentDbStatus === "failed") {
        throw new Error(initialStatus.data.error_message || "Proses gagal");
      } else {
        setCurrentStatus(currentDbStatus);
        // 🔥 SUBSCRIBE REALTIME
        await subscribeToReport(reportId);
      }

      // AMBIL SUMMARY
      const summaryRes = await axios.get(`${API}/summary/${reportId}`);
      console.log("SUMMARY RESPONSE:", summaryRes.data);

      if (summaryRes.data.status === "success") {
        setPdfUrl(summaryRes.data.url);
      } else {
        throw new Error(summaryRes.data.message || "Summary belum tersedia");
      }
    } catch (err: any) {
      console.error("GENERATE ERROR:", err);
      alert(
        err?.response?.data?.message || err?.message || "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStatus(""), 1000);
    }
  };

  const isComplete = Object.values(filters).every((v) => v !== "");
  const buttonLabel = loading
    ? STATUS_LABEL[currentStatus] || "Processing..."
    : "Generate";

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Laporan Evaluasi</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        {filterList.map((item) => (
          <div key={item} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFilter(item);
              }}
              className="px-4 py-2 bg-white rounded-xl shadow text-sm flex items-center gap-2"
            >
              {filters[item] || item}
              <FiChevronDown />
            </button>

            {activeFilter === item && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-12 w-52 bg-white shadow-lg rounded-xl p-2 z-20"
              >
                {options[item]?.length > 0 ? (
                  options[item].map((opt: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleSelect(item, opt)}
                      className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                    >
                      {opt}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">Tidak ada data</p>
                )}
              </div>
            )}
          </div>
        ))}

        <button
          disabled={!isComplete || loading}
          onClick={handleGenerate}
          className={`px-5 py-2 rounded-lg min-w-[160px] flex items-center justify-center gap-2 text-white transition
            ${
              !isComplete || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#A44A4A] hover:opacity-90"
            }
          `}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {buttonLabel}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-[700px]"
            title="PDF Viewer"
          />
        ) : (
          <div className="h-[500px] flex items-center justify-center text-gray-400">
            Belum ada laporan
          </div>
        )}
      </div>
    </div>
  );
}