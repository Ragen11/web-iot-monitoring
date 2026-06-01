import { FiBookOpen, FiLayers, FiClock, FiMessageCircle } from "react-icons/fi";
import { useEffect, useState } from "react";
import axios from "axios";

import Card from "../components/Card";
import ChartPie from "../components/charts/PieChart";
import ChartLine from "../components/charts/LineChart";
import Gauge from "../components/Gauge";
import RightPanel from "../components/RightPanel";

import DetailPieModal from "../pages/DetailPieModal";
import DetailGaugeModal from "../pages/DetailGaugeModal";

export default function Dashboard() {

  const [openPieDetail, setOpenPieDetail]     = useState(false);
  const [openGaugeDetail, setOpenGaugeDetail] = useState(false);

  // KPI Cards data
  const [totalKelas,       setTotalKelas]       = useState<number | null>(null);
  const [totalMatkul,      setTotalMatkul]      = useState<number | null>(null);
  const [tepatWaktuPct,    setTepatWaktuPct]    = useState<number | null>(null);
  const [dominantActivity, setDominantActivity] = useState<string>("-");
  const [dominantPct,      setDominantPct]      = useState<number>(0);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // dashboard summary (total kelas, matkul, tepat waktu)
    axios
      .get(`${API_URL}/dashboard/summary`, { params: { range_days: 30 } })
      .then((res) => {
        setTotalKelas(res.data?.total_kelas ?? 0);
        setTotalMatkul(res.data?.total_matkul ?? 0);
        setTepatWaktuPct(res.data?.tepat_waktu_pct ?? 0);
      })
      .catch((err) => console.error("❌ dashboard summary error:", err));

    // aktivitas dominan
    axios
      .get(`${API_URL}/aktivitas/summary`, { params: { range_days: 30 } })
      .then((res) => {
        setDominantActivity(res.data?.dominant_activity ?? "-");
        setDominantPct(res.data?.dominant_pct ?? 0);
      })
      .catch((err) => console.error("❌ dominant activity error:", err));
  }, [API_URL]);

  // helper format
  const fmt = (n: number | null) => (n === null ? "…" : n.toLocaleString("id-ID"));

  return (
    <>
      <div className="flex-1 p-4 sm:p-6">

        <div className="flex flex-col xl:flex-row gap-6 mt-6">

          <div className="flex-1 space-y-6 min-w-0">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              title="Total Kelas"
              value={fmt(totalKelas)}
              icon={<FiLayers />}
              iconBg="bg-[#fdf0f0]"
              iconColor="text-primary"
            />
            <Card
              title="Total Matkul"
              value={fmt(totalMatkul)}
              icon={<FiBookOpen />}
              iconBg="bg-[#f0f4ff]"
              iconColor="text-blue-500"
            />
            <Card
              title="Dosen Tepat Waktu"
              value={tepatWaktuPct === null ? "…" : `${tepatWaktuPct}%`}
              icon={<FiClock />}
              iconBg="bg-[#f0fdf4]"
              iconColor="text-green-500"
            />
            <Card
              title="Aktivitas Dominan"
              value={dominantActivity === "-" ? "-" : `${dominantActivity} (${dominantPct}%)`}
              icon={<FiMessageCircle />}
              iconBg="bg-[#fdf8f0]"
              iconColor="text-orange-400"
            />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartPie
                onDetailClick={() => setOpenPieDetail(true)}
              />

              <Gauge
                onDetailClick={() => setOpenGaugeDetail(true)}
              />

            </div>

            <ChartLine />
          </div>

          <RightPanel />
        </div>
      </div>

      <DetailPieModal
        open={openPieDetail}
        onClose={() => setOpenPieDetail(false)}
      />

      <DetailGaugeModal
        open={openGaugeDetail}
        onClose={() => setOpenGaugeDetail(false)}
      />
    </>
  );
}