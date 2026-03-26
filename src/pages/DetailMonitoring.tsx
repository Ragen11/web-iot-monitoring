import { useLocation } from "react-router-dom";

export default function DetailMonitoring() {
  const { state } = useLocation();

  const data = state || {
    matkul: "Elektronika Dasar",
    kode: "TKI2H4",
    hari: "Kamis",
    jam: "08.00 - 10.00",
    ruangan: "TULT 14.15",
    kodeDosen: "AGV",
    namaDosen: "Agus Virgono",
    kehadiran: "Tepat Waktu (07.30)",
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center mb-6">
        <h1 className="text-xl font-semibold">Hasil Monitoring</h1>

        <button className="ml-auto bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
          ⬇ Download Laporan
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
        {/* DETAIL KELAS */}
        <div>
          <h2 className="font-semibold mb-4">Detail Kelas</h2>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p>Mata Kuliah</p>
            <p>: {data.matkul} ({data.kode})</p>

            <p>Hari</p>
            <p>: {data.hari}</p>

            <p>Jam</p>
            <p>: {data.jam}</p>

            <p>Ruangan</p>
            <p>: {data.ruangan}</p>

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
          <p className="mb-2 text-sm">Aktivitas Kelas</p>

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
              <span className="text-purple-500">• Ceramah</span>
              <span className="text-red-400">• Diskusi</span>
              <span className="text-blue-400">• Tanya Jawab</span>
            </div>
          </div>
        </div>

        {/* VIDEO */}
        <div>
          <p className="mb-2 text-sm">Video Monitoring</p>

          <div className="w-60 h-40 bg-gray-200 flex items-center justify-center rounded-lg">
            ▶
          </div>
        </div>

        {/* PDF PREVIEW */}
        <div>
          <p className="mb-2 text-sm">Preview Laporan</p>

          <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
            PDF Preview
          </div>
        </div>
      </div>
    </div>
  );
}