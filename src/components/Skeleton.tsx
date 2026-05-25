// Blok shimmer generik
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );
}

// Skeleton untuk KPI Card
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Skeleton untuk baris tabel
export function SkeletonTableRow({ cols = 8 }: { cols?: number }) {
  return (
    <tr className="border-t">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-3.5 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton untuk halaman HasilMonitoring (tabel penuh)
export function SkeletonTable({ rows = 8, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}
