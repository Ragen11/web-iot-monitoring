import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck, FiCalendar, FiLayers } from "react-icons/fi";
import { useTahunAjaran } from "../context/TahunAjaranContext";

export default function TahunAjaranSwitcher() {
  const { list, aktif, selected, setSelected, loading } = useTahunAjaran();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // skeleton placeholder saat loading awal
  if (loading && !selected) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-400">
        <FiCalendar size={13} />
        <span className="animate-pulse">Memuat TA...</span>
      </div>
    );
  }

  // user belum login atau tidak ada TA sama sekali → tidak render
  if (!loading && list.length === 0) return null;

  const isAll = selected === null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-sm"
        title="Ganti Tahun Ajaran"
      >
        {isAll ? (
          <FiLayers size={13} className="text-gray-400 shrink-0" />
        ) : (
          <FiCalendar size={13} className="text-primary shrink-0" />
        )}

        <span className="font-medium text-gray-700 hidden sm:inline">
          {isAll ? "Semua TA" : selected!.label}
        </span>
        <span className="font-medium text-gray-700 sm:hidden">
          {isAll
            ? "Semua"
            : `${selected!.tahun.slice(2, 4)}/${selected!.tahun.slice(7, 9)}`}
        </span>

        {!isAll && selected!.id === aktif?.id && (
          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            Aktif
          </span>
        )}

        <FiChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400 font-medium">
            Pilih Tahun Ajaran
          </div>
          <div className="max-h-72 overflow-y-auto">
            {/* Opsi "Semua Tahun Ajaran" */}
            <button
              onClick={() => { setSelected(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left ${
                isAll ? "bg-primary/5" : ""
              }`}
            >
              {isAll ? (
                <FiCheck size={14} className="text-primary shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className={`truncate ${isAll ? "text-primary font-medium" : "text-gray-500"}`}>
                Semua Tahun Ajaran
              </span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-2" />

            {list.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-400 text-center">
                Belum ada tahun ajaran
              </p>
            ) : (
              list.map((ta) => {
                const isSelected = !isAll && ta.id === selected!.id;
                return (
                  <button
                    key={ta.id}
                    onClick={() => { setSelected(ta); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <FiCheck size={14} className="text-primary shrink-0" />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}
                      <span className={`truncate ${isSelected ? "text-primary font-medium" : "text-gray-700"}`}>
                        {ta.label}
                      </span>
                    </div>
                    {ta.is_aktif && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
