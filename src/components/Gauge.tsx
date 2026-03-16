export default function Gauge() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center">
      <h2 className="font-semibold mb-4">Kehadiran Dosen</h2>

      <div className="w-40 h-40 rounded-full border-[12px] border-green-400 flex items-center justify-center">
        <span className="text-2xl font-bold">96%</span>
      </div>

      <div className="flex gap-4 text-xs mt-4">
        <span className="text-green-500">Sangat Baik</span>
        <span className="text-yellow-500">Perlu Perhatian</span>
        <span className="text-red-500">Perlu Tindakan</span>
      </div>
    </div>
  );
}