import CalendarCard from "./CalendarCard";

export default function RightPanel() {
  return (
    <div className="w-80 space-y-6">
      <CalendarCard />

      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h2 className="font-semibold">Current Class</h2>
        <div className="mt-3 p-3 border border-green-400 rounded-xl text-sm">
          AZK4BAA2 - PROPOSAL TUGAS AKHIR
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h2 className="font-semibold">Upcoming Class</h2>
        <div className="mt-3 p-3 border border-red-400 rounded-xl text-sm">
          AZK4BAA2 - PROPOSAL TUGAS AKHIR
        </div>
      </div>
    </div>
  );
}