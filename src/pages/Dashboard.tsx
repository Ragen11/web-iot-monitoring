import { FiBookOpen, FiLayers, FiClock, FiMonitor } from "react-icons/fi";
import { useState } from "react";

import Card from "../components/Card";
import ChartPie from "../components/charts/PieChart";
import ChartLine from "../components/charts/LineChart";
import Gauge from "../components/Gauge";
import RightPanel from "../components/RightPanel";

import DetailPieModal from "../pages/DetailPieModal";
import DetailGaugeModal from "../pages/DetailGaugeModal";

export default function Dashboard() {

  // PIE MODAL
  const [openPieDetail, setOpenPieDetail] = useState(false);

  // GAUGE MODAL
  const [openGaugeDetail, setOpenGaugeDetail] = useState(false);

  return (
    <>
      <div className="flex-1 p-6">

        <div className="flex gap-6 mt-6">

          {/* MAIN */}
          <div className="flex-1 space-y-6">

            {/* KPI */}
            <div className="grid grid-cols-4 gap-4">
            <Card
              title="Total Kelas"
              value="7,265"
              icon={<FiLayers />}
              iconBg="bg-[#fdf0f0]"
              iconColor="text-[#A44A4A]"
            />
            <Card
              title="Total Matkul"
              value="3,842"
              icon={<FiBookOpen />}
              iconBg="bg-[#f0f4ff]"
              iconColor="text-blue-500"
            />
            <Card
              title="Dosen Tepat Waktu"
              value="91%"
              icon={<FiClock />}
              iconBg="bg-[#f0fdf4]"
              iconColor="text-green-500"
            />
            <Card
              title="Metode Pembelajaran"
              value="4 Jenis"
              icon={<FiMonitor />}
              iconBg="bg-[#fdf8f0]"
              iconColor="text-orange-400"
            />
          </div>

            {/* CHARTS */}
            <div className="grid grid-cols-2 gap-4">

              {/* PIE CHART */}
              <ChartPie
                onDetailClick={() => setOpenPieDetail(true)}
              />

              {/* GAUGE */}
              <Gauge
                onDetailClick={() => setOpenGaugeDetail(true)}
              />

            </div>

            {/* LINE CHART */}
            <ChartLine />
          </div>

          {/* RIGHT PANEL */}
          <RightPanel />
        </div>
      </div>

      {/* PIE DETAIL MODAL */}
      <DetailPieModal
        open={openPieDetail}
        onClose={() => setOpenPieDetail(false)}
      />

      {/* GAUGE DETAIL MODAL */}
      <DetailGaugeModal
        open={openGaugeDetail}
        onClose={() => setOpenGaugeDetail(false)}
      />
    </>
  );
}