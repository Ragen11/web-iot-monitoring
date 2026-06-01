import { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export type FilterOption = { value: string; label: string };

type Props = {
  /** Placeholder text saat tidak ada nilai dipilih (juga jadi opsi "reset") */
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Lebar tombol, default w-44. Pakai class tailwind. */
  width?: string;
  /** Tampilkan opsi reset pertama (default true) */
  showReset?: boolean;
  /** Variant: "card" (untuk dalam card kecil) | "modal" (untuk modal/halaman) */
  size?: "sm" | "md";
};

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  width = "w-44",
  showReset = true,
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`${width} ${pad} flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition`}
      >
        <span className="truncate">{selectedLabel || label}</span>
        <FiChevronDown className="text-gray-400 shrink-0" size={size === "sm" ? 13 : 16} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-[calc(100%+4px)] left-0 ${width} bg-white border border-gray-100 shadow-lg rounded-xl p-1.5 z-30 max-h-64 overflow-y-auto`}
        >
          {showReset && (
            <div
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg text-sm ${
                value === "" ? "text-primary font-medium" : "text-gray-500"
              }`}
            >
              {label}
            </div>
          )}

          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Tidak ada data</p>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg text-sm truncate ${
                  value === opt.value ? "text-primary font-medium" : "text-gray-700"
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
