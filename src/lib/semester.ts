// Konfigurasi & perhitungan minggu perkuliahan (dipakai di Hasil & Detail Monitoring)

// Semester configuration
export const SEMESTER_START_DATE = "2026-02-23";

// Default minggu skip (libur) — dipakai bila admin belum mengatur manual
export const DEFAULT_SKIP_WEEKS = ["2026-03-16", "2026-05-27"];

const SKIP_WEEKS_STORAGE_KEY = "skipWeeks";

// Ambil daftar minggu skip: hasil input manual (localStorage) > default
export const getSkipWeeks = (): string[] => {
  try {
    const raw = localStorage.getItem(SKIP_WEEKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((d) => typeof d === "string");
    }
  } catch (err) {
    console.error("[semester] getSkipWeeks error:", err);
  }
  return DEFAULT_SKIP_WEEKS;
};

// Simpan daftar minggu skip (manual). Normalisasi: unik + urut menaik.
export const setSkipWeeks = (weeks: string[]): string[] => {
  const normalized = [...new Set(weeks.filter(Boolean))].sort();
  localStorage.setItem(SKIP_WEEKS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

// Kembalikan ke nilai default (hapus override manual)
export const resetSkipWeeks = (): string[] => {
  localStorage.removeItem(SKIP_WEEKS_STORAGE_KEY);
  return DEFAULT_SKIP_WEEKS;
};

// Hitung minggu ke berdasarkan tanggal
export const calculateMingguKe = (tanggal: string): number | null => {
  if (!tanggal) return null;

  const startDate = new Date(SEMESTER_START_DATE);
  startDate.setHours(0, 0, 0, 0);

  const checkDate = new Date(tanggal);
  checkDate.setHours(0, 0, 0, 0);

  // Hitung hari selisih dari start date
  const daysFromStart = Math.floor((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(daysFromStart / 7);

  // Hitung minggu ke dengan menyesuaikan skip weeks
  // Awalnya minggu adalah weekIndex + 1
  let mingguKe = weekIndex + 1;

  // Hitung berapa banyak skip weeks yang ada SEBELUM week ini
  const skipWeeksBeforeThisWeek = getSkipWeeks().filter((skipDate) => {
    const skipDateObj = new Date(skipDate);
    skipDateObj.setHours(0, 0, 0, 0);
    const skipWeekIndex = Math.floor((skipDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return skipWeekIndex < weekIndex;
  }).length;

  // Kurangi minggu number dengan jumlah skip weeks sebelumnya
  mingguKe = mingguKe - skipWeeksBeforeThisWeek;

  return mingguKe > 0 ? mingguKe : null;
};

// Check if tanggal ini jatuh pada skip week
export const isSkipWeek = (tanggal: string): boolean => {
  if (!tanggal) return false;

  const startDate = new Date(SEMESTER_START_DATE);
  startDate.setHours(0, 0, 0, 0);

  const checkDate = new Date(tanggal);
  checkDate.setHours(0, 0, 0, 0);

  // Hitung week index dari checkDate
  const daysFromStart = Math.floor((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(daysFromStart / 7);

  // Hitung tanggal awal untuk week ini
  const weekStartDate = new Date(startDate);
  weekStartDate.setDate(weekStartDate.getDate() + weekIndex * 7);

  // Cek apakah start date of this week ada di daftar skip
  return getSkipWeeks().some((skipDate) => {
    const skip = new Date(skipDate);
    skip.setHours(0, 0, 0, 0);
    return weekStartDate.getTime() === skip.getTime();
  });
};
