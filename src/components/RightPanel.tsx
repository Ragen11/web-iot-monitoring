import CalendarCard from "./CalendarCard";
import AnomaliTable from "./AnomaliTable";

export default function RightPanel() {
  return (
    <div className="w-full xl:w-80 space-y-6 shrink-0">
      <CalendarCard />

      {/* Tabel deteksi anomali (menggantikan Kelas Saat Ini & Kelas Berikutnya) */}
      <AnomaliTable />
    </div>
  );
}
