import { useState } from "react";
import axios from "axios";
import { FiBookOpen, FiTrash2 } from "react-icons/fi";

type RPSEntry = {
  kodeMatkul: string;
  pertemuan: number;
  materi: string;
  pengalaman: string;
};

// ✅ TYPE KHUSUS ERROR
type FormErrors = Partial<Record<keyof RPSEntry, string>>;

const EMPTY_FORM: RPSEntry = {
  kodeMatkul: "",
  pertemuan: 1,
  materi: "",
  pengalaman: "",
};

export default function InputRPS() {
  const [form, setForm] = useState<RPSEntry>(EMPTY_FORM);

  // ✅ FIX ERROR TYPESCRIPT
  const [errors, setErrors] = useState<FormErrors>({});

  const [loading, setLoading] = useState(false);

  const [list, setList] = useState<RPSEntry[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // =========================
  // VALIDATION
  // =========================
  const validate = (): FormErrors => {
    const e: FormErrors = {};

    if (!form.kodeMatkul.trim()) {
      e.kodeMatkul = "Kode Matkul tidak boleh kosong.";
    }

    if (!form.pertemuan || form.pertemuan < 1) {
      e.pertemuan = "Pertemuan ke harus diisi (min. 1).";
    }

    if (!form.materi.trim()) {
      e.materi = "Materi Pembelajaran tidak boleh kosong.";
    }

    if (!form.pengalaman.trim()) {
      e.pengalaman =
        "Pengalaman Pembelajaran tidak boleh kosong.";
    }

    return e;
  };

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "pertemuan"
          ? Number(value)
          : value,
    }));

    // HAPUS ERROR FIELD SAAT USER MENGETIK
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    const e = validate();

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    try {
      setLoading(true);

      console.log("SUBMIT DATA:", form);

      await axios.post(`${API_URL}/rps`, form);

      // TAMBAHKAN KE LIST
      setList((prev) => [...prev, form]);

      // RESET FORM
      setForm(EMPTY_FORM);

      // RESET ERROR
      setErrors({});

      alert("Data RPS berhasil disimpan!");
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err);

      alert(
        err?.response?.data?.message ||
          "Submit gagal!"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = (index: number) => {
    setList((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* HEADER */}
      <h1 className="text-xl font-semibold">
        Input RPS
      </h1>

      {/* ========================= */}
      {/* FORM CARD */}
      {/* ========================= */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <FiBookOpen
            className="text-[#A44A4A]"
            size={18}
          />

          <h2 className="font-semibold text-gray-700">
            Data RPS
          </h2>
        </div>

        {/* ========================= */}
        {/* KODE MATKUL */}
        {/* ========================= */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kode Matkul
          </label>

          <input
            type="text"
            name="kodeMatkul"
            value={form.kodeMatkul}
            onChange={handleChange}
            placeholder="Contoh: AZK4BAA2"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A44A4A]/30 focus:border-[#A44A4A] transition ${
              errors.kodeMatkul
                ? "border-red-400"
                : "border-gray-200"
            }`}
          />

          {errors.kodeMatkul && (
            <p className="text-xs text-red-500 mt-1">
              {errors.kodeMatkul}
            </p>
          )}
        </div>

        {/* ========================= */}
        {/* PERTEMUAN */}
        {/* ========================= */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pertemuan ke
          </label>

          <input
            type="number"
            name="pertemuan"
            min={1}
            value={form.pertemuan}
            onChange={handleChange}
            placeholder="Contoh: 1"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A44A4A]/30 focus:border-[#A44A4A] transition ${
              errors.pertemuan
                ? "border-red-400"
                : "border-gray-200"
            }`}
          />

          {errors.pertemuan && (
            <p className="text-xs text-red-500 mt-1">
              {errors.pertemuan}
            </p>
          )}
        </div>

        {/* ========================= */}
        {/* MATERI */}
        {/* ========================= */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Materi Pembelajaran
          </label>

          <textarea
            name="materi"
            rows={4}
            value={form.materi}
            onChange={handleChange}
            placeholder="Tuliskan materi yang akan diajarkan pada pertemuan ini..."
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A44A4A]/30 focus:border-[#A44A4A] transition resize-none ${
              errors.materi
                ? "border-red-400"
                : "border-gray-200"
            }`}
          />

          {errors.materi && (
            <p className="text-xs text-red-500 mt-1">
              {errors.materi}
            </p>
          )}
        </div>

        {/* ========================= */}
        {/* PENGALAMAN */}
        {/* ========================= */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pengalaman Pembelajaran Mahasiswa
          </label>

          <textarea
            name="pengalaman"
            rows={4}
            value={form.pengalaman}
            onChange={handleChange}
            placeholder="Tuliskan pengalaman belajar yang diharapkan mahasiswa dapatkan..."
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A44A4A]/30 focus:border-[#A44A4A] transition resize-none ${
              errors.pengalaman
                ? "border-red-400"
                : "border-gray-200"
            }`}
          />

          {errors.pengalaman && (
            <p className="text-xs text-red-500 mt-1">
              {errors.pengalaman}
            </p>
          )}
        </div>

        {/* ========================= */}
        {/* BUTTON */}
        {/* ========================= */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-2.5 rounded-xl text-white text-sm font-medium transition ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#A44A4A] hover:bg-[#8f3e3e]"
          }`}
        >
          {loading
            ? "Menyimpan..."
            : "Simpan"}
        </button>
      </div>

      {/* ========================= */}
      {/* LIST RPS */}
      {/* ========================= */}
      {list.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Data RPS yang Telah Diinput
          </h2>

          <div className="space-y-3">
            {list.map((item, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex gap-4"
              >
                {/* BADGE */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#A44A4A]/10 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[#A44A4A] font-medium leading-none">
                    Prt.
                  </span>

                  <span className="text-lg font-bold text-[#A44A4A] leading-none">
                    {item.pertemuan}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0 space-y-1 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">
                      Kode Matkul
                    </span>

                    <p className="text-gray-700 font-medium">
                      {item.kodeMatkul}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">
                      Materi Pembelajaran
                    </span>

                    <p className="text-gray-700 line-clamp-2">
                      {item.materi}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">
                      Pengalaman Pembelajaran
                    </span>

                    <p className="text-gray-700 line-clamp-2">
                      {item.pengalaman}
                    </p>
                  </div>
                </div>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(i)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition self-start mt-0.5"
                  title="Hapus"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}