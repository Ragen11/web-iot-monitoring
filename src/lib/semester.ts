// Konfigurasi & perhitungan minggu perkuliahan (dipakai di Hasil & Detail Monitoring)

// Semester configuration
export const SEMESTER_START_DATE = "2026-02-23";
export const SKIP_WEEKS = ["2026-03-16", "2026-05-27"];

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
  const skipWeeksBeforeThisWeek = SKIP_WEEKS.filter((skipDate) => {
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

  // Cek apakah start date of this week ada di SKIP_WEEKS
  return SKIP_WEEKS.some((skipDate) => {
    const skip = new Date(skipDate);
    skip.setHours(0, 0, 0, 0);
    return weekStartDate.getTime() === skip.getTime();
  });
};
