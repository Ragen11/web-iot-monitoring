export type Range = "1D" | "1W" | "1M" | "6M";

type Props = {
  value: Range;
  onChange: (v: Range) => void;
  size?: "sm" | "md";
};

const RANGES: Range[] = ["1D", "1W", "1M", "6M"];

export default function RangeToggle({ value, onChange, size = "md" }: Props) {
  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`${pad} rounded-lg transition ${
            value === r
              ? "bg-white shadow-sm font-medium text-gray-900"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
