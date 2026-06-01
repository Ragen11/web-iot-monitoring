import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { supabase } from "../lib/supabase"; // 🔥 sesuaikan path
import type { RealtimeChannel } from "@supabase/supabase-js";
import FilterDropdown, { type FilterOption } from "../components/FilterDropdown";

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

const FILTER_LABEL: Record<string, string> = {
  dosen: "Dosen",
  jumlah_pertemuan: "Jumlah Pertemuan",
};

export default function LaporanEvaluasi() {
  const [filters, setFilters] = useState<any>({
    dosen: "",
    jumlah_pertemuan: "",
  });

  const [options, setOptions] = useState<any>({});
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const channelRef = useRef<RealtimeChannel | null>(null);

  const filterList = ["dosen", "jumlah_pertemuan"];

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
      toast.error(
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
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-6">Laporan Evaluasi</h1>

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {filterList.map((item) => (
          <FilterDropdown
            key={item}
            width="w-48"
            label={FILTER_LABEL[item] || item}
            value={filters[item] || ""}
            onChange={(v) => handleSelect(item, v)}
            options={(options[item] || []).map((opt: string) => ({
              value: opt,
              label: opt,
            } as FilterOption))}
          />
        ))}

        <button
          disabled={!isComplete || loading}
          onClick={handleGenerate}
          className={`px-5 py-2 rounded-lg w-full sm:w-auto sm:min-w-[160px] flex items-center justify-center gap-2 text-white transition
            ${
              !isComplete || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:opacity-90"
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
            className="w-full h-[400px] sm:h-[550px] lg:h-[700px]"
            title="PDF Viewer"
          />
        ) : (
          <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center text-gray-400 text-sm">
            Belum ada laporan
          </div>
        )}
      </div>
    </div>
  );
}