import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "../auth/useAuth";

export type TahunAjaran = {
  id: string;
  tahun: string;                  // "2025/2026"
  semester: "ganjil" | "genap";
  is_aktif: boolean;
  label: string;                  // "2025/2026 Ganjil"
  jadwal_count?: number;
  rps_count?: number;
};

interface TAContextType {
  list: TahunAjaran[];
  aktif: TahunAjaran | null;
  selected: TahunAjaran | null;
  loading: boolean;
  setSelected: (ta: TahunAjaran | null) => void;
  refresh: () => Promise<void>;
}

const TahunAjaranContext = createContext<TAContextType | null>(null);
const STORAGE_KEY = "selectedTahunAjaranId";

export function TahunAjaranProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [list, setList]             = useState<TahunAjaran[]>([]);
  const [aktif, setAktif]           = useState<TahunAjaran | null>(null);
  const [selected, setSelectedState] = useState<TahunAjaran | null>(null);
  const [loading, setLoading]       = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // ── REFRESH dari backend ────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, aktifRes] = await Promise.all([
        axios.get(`${API_URL}/tahun-ajaran`, {
          params: { with_counts: "true" },
        }),
        axios.get(`${API_URL}/tahun-ajaran/aktif`),
      ]);

      const taList: TahunAjaran[] = listRes.data?.data || [];
      const taAktif: TahunAjaran | null = aktifRes.data?.data || null;

      setList(taList);
      setAktif(taAktif);

      // Set selected: dari localStorage > TA aktif > null
      const storedId = localStorage.getItem(STORAGE_KEY);
      let candidate: TahunAjaran | null = null;

      if (storedId) {
        candidate = taList.find((t) => t.id === storedId) || null;
      }
      if (!candidate) candidate = taAktif;

      setSelectedState(candidate);
    } catch (err) {
      console.error("[TA] refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // ── Update selected + simpan ke localStorage ────────────
  const setSelected = useCallback((ta: TahunAjaran | null) => {
    setSelectedState(ta);
    if (ta) {
      localStorage.setItem(STORAGE_KEY, ta.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ── Auto-fetch saat user login, clear saat logout ───────
  useEffect(() => {
    if (!user) {
      setList([]);
      setAktif(null);
      setSelectedState(null);
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      return;
    }
    refresh();
  }, [user, refresh]);

  return (
    <TahunAjaranContext.Provider
      value={{ list, aktif, selected, loading, setSelected, refresh }}
    >
      {children}
    </TahunAjaranContext.Provider>
  );
}

export function useTahunAjaran() {
  const ctx = useContext(TahunAjaranContext);
  if (!ctx) {
    throw new Error(
      "useTahunAjaran harus dipakai di dalam TahunAjaranProvider"
    );
  }
  return ctx;
}
