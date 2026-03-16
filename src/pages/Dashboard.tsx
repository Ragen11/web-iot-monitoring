import Card from "../components/Card";
import ChartPie from "../components/charts/PieChart";
import ChartLine from "../components/charts/LineChart";
import Gauge from "../components/Gauge";
import RightPanel from "../components/RightPanel";

export default function Dashboard() {
  return (
    <div className="flex-1 p-6">

      <div className="flex gap-6 mt-6">
        {/* MAIN */}
        <div className="flex-1 space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-4 gap-4">
            <Card title="Total Kelas" value="7,265" />
            <Card title="Total Matkul" value="7,265" />
            <Card title="Dosen Tepat Waktu" value="7,265" />
            <Card title="Metode Pembelajaran" value="7,265" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <ChartPie />
            <Gauge />
          </div>

          <ChartLine />
        </div>

 
        <RightPanel />
      </div>
    </div>
  );
}