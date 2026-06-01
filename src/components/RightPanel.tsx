import { FiClock, FiMapPin } from "react-icons/fi";
import CalendarCard from "./CalendarCard";

type ClassCardProps = {
  kode: string;
  matkul: string;
  jam: string;
  ruangan: string;
  accent: string;
  accentBg: string;
};

function ClassCard({ kode, matkul, jam, ruangan, accent, accentBg}: ClassCardProps) {
  return (
    <div className={`relative ${accentBg} rounded-2xl p-4 overflow-hidden`}>

      <p className={`text-xs font-semibold ${accent} mb-1`}>{kode}</p>
      <p className="text-sm font-bold text-gray-800 mb-3">{matkul}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiClock className="text-gray-400" />
          {jam}
        </span>
        <span className="flex items-center gap-1">
          <FiMapPin className="text-gray-400" />
          {ruangan}
        </span>
      </div>
    </div>
  );
}

export default function RightPanel() {
  return (
    <div className="w-full xl:w-80 space-y-6 shrink-0">
      <CalendarCard />

        {/* Kelas Saat Ini */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <h2 className="text-sm font-semibold text-gray-700">Kelas Saat Ini</h2>
          </div>
          <ClassCard
            kode="AZK4BAA2"
            matkul="Proposal Tugas Akhir"
            jam="08:00 - 10:00"
            ruangan="Lab 203"
            accent="text-primary"
            accentBg="bg-[#f0fdf4]"
          />
        </div>

        {/* Kelas Berikutnya */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <h2 className="text-sm font-semibold text-gray-700">Kelas Berikutnya</h2>
          </div>
          <ClassCard
            kode="AZK4BAA2"
            matkul="Proposal Tugas Akhir"
            jam="13:00 - 15:00"
            ruangan="Ruang C401"
            accent="text-primary"
            accentBg="bg-[#fff7f0]"
          />
        </div>
    </div>
  );
}
