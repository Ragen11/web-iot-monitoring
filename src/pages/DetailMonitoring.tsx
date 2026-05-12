import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DetailMonitoring() {

  const { state } = useLocation();
  const { id } = useParams();

  const [data, setData] = useState<any>(state || null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {

    if (!id) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/${id}`)
      .then((res) => {

        const m = res.data;

        const formatted = {
          matkul: m.jadwal_kuliah?.mata_kuliah,
          kode: m.jadwal_kuliah?.kode_mata_kuliah,
          hari: m.jadwal_kuliah?.hari,
          jam: `${m.jadwal_kuliah?.jam_mulai?.slice(0,5)} - ${m.jadwal_kuliah?.jam_selesai?.slice(0,5)}`,
          ruangan: m.jadwal_kuliah?.ruangan,
          kodeDosen: m.jadwal_kuliah?.dosen_utama,
          namaDosen: m.jadwal_kuliah?.dosen_utama,
          kehadiran: m.kehadiran,
          aktivitas: m.aktivitas_dominan,
          video_url: m.video_url
        };

        setData(formatted);
      })
      .catch((err) => {
        console.error("Error fetch detail monitoring:", err);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [id]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!data) {
    return (
      <p className="p-6 text-red-500">
        Data monitoring tidak ditemukan
      </p>
    );
  }

  return (
    <div>

      {/* HEADER */}
      <div className="flex items-center mb-6">

        <h1 className="text-xl font-semibold">
          Hasil Monitoring
        </h1>

        <button className="ml-auto bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
          ⬇ Download Laporan
        </button>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">

        {/* DETAIL KELAS */}
        <div>

          <h2 className="font-semibold mb-4">
            Detail Kelas
          </h2>

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

          <p className="mb-2 text-sm">
            Aktivitas Kelas
          </p>

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

              <span className="text-purple-500">
                • Ceramah
              </span>

              <span className="text-red-400">
                • Diskusi
              </span>

              <span className="text-blue-400">
                • Tanya Jawab
              </span>

            </div>

          </div>

        </div>


        {/* VIDEO */}
        <div>

          <p className="mb-2 text-sm">
            Video Monitoring
          </p>

          {data.video_url ? (

            <iframe
              src={data.video_url}
              className="w-[400px] h-[250px] rounded-lg"
              allow="autoplay"
            />

          ) : (

            <div className="w-60 h-40 bg-gray-200 flex items-center justify-center rounded-lg">
              Tidak ada video
            </div>

          )}

        </div>


        {/* PDF PREVIEW */}
        <div>

          <p className="mb-2 text-sm">
            Preview Laporan
          </p>

          <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
            PDF Preview
          </div>

        </div>

      </div>

    </div>
  );
}