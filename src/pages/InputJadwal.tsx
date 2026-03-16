import { useState } from "react";

export default function InputJadwal() {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = (e: any) => {
    setFiles([...files, ...e.target.files]);
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-xl font-semibold">Input Jadwal</h1>

      {/* UPLOAD CARD */}
      <div className="bg-white rounded-2xl shadow p-6">

        <h2 className="font-semibold mb-2">Media Upload</h2>

        <p className="text-sm text-gray-400 mb-4">
          Add your documents here, and you can upload up to 5 files max
        </p>

        <label className="border-2 border-dashed border-blue-300 rounded-xl p-10 flex flex-col items-center cursor-pointer hover:bg-gray-50">

          <span className="text-gray-500 mb-2">
            Drag your file(s) or browse
          </span>

          <span className="text-xs text-gray-400">
            Max 10 MB files are allowed
          </span>

          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        <p className="text-xs text-gray-400 mt-3">
          Only support .pdf, .csv, and .xlsx files
        </p>

        <button className="mt-4 bg-[#A44A4A] text-white px-6 py-2 rounded-lg">
          Submit
        </button>

      </div>

      {/* JADWAL GRID */}
      <div>

        <h2 className="font-semibold mb-4">Jadwal Perkuliahan</h2>

        <div className="grid grid-cols-3 gap-6">

          {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(
            (day) => (
              <div
                key={day}
                className="bg-white rounded-xl shadow"
              >
                <div className="bg-[#A44A4A] text-white text-center py-2 rounded-t-xl">
                  {day}
                </div>

                <div className="p-4 space-y-3">

                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3 text-xs"
                    >
                      AZK4BAA2 - PROPOSAL TUGAS AKHIR - RLC
                      <br />
                      <span className="text-gray-400">
                        11.30 AM - 12.30 PM
                      </span>
                    </div>
                  ))}

                </div>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
}