import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import illustration from "../assets/login.png";
import klaktifyLogo from "../assets/clactify-logo.png";
import { useAuth } from "../auth/useAuth";

// Konfigurasi rate limit
const MAX_ATTEMPTS   = 5;
const LOCK_DURATION  = 30; // detik
const STORAGE_KEY    = "login_lock";

// Opsi A — baca kunci tersimpan dari localStorage (tahan refresh)
const readStoredLock = (): { failedAttempts: number; lockedUntil: number | null } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { failedAttempts: 0, lockedUntil: null };
    const v = JSON.parse(raw);
    const lockedUntil =
      typeof v?.lockedUntil === "number" && v.lockedUntil > Date.now()
        ? v.lockedUntil
        : null;
    return { failedAttempts: v?.failedAttempts ?? 0, lockedUntil };
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
};

export default function Login() {

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // Rate limit state (init dari localStorage — Opsi A)
  const [failedAttempts, setFailedAttempts] = useState(() => readStoredLock().failedAttempts);
  const [lockedUntil, setLockedUntil]       = useState<number | null>(() => readStoredLock().lockedUntil);
  const [secondsLeft, setSecondsLeft]       = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const usernameRef = useRef<HTMLInputElement>(null);

  // 🔥 SESSION EXPIRED MESSAGE
  useEffect(() => {

    if (location.state?.expired) {
      setError("Session telah berakhir, silakan login kembali");
    }

  }, [location.state]);

  // 🎯 AUTOFOCUS USERNAME SAAT MOUNT
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // ⏱️ COUNTDOWN saat locked
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setError("");
      }
    };

    tick(); // langsung jalan
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // 💾 Opsi A — simpan kunci ke localStorage agar bertahan saat refresh
  useEffect(() => {
    if (lockedUntil || failedAttempts > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lockedUntil, failedAttempts }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [lockedUntil, failedAttempts]);

  const isLocked = !!lockedUntil && lockedUntil > Date.now();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (loading || isLocked) return;

    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong");
      return;
    }

    setError("");
    setLoading(true);

    const uname = username.trim();
    const lockUrl = `${API_URL}/auth/login-lock/${encodeURIComponent(uname)}`;

    const success = await login(username, password);

    setLoading(false);

    if (success) {
      // Reset (lokal + server di latar belakang)
      setFailedAttempts(0);
      setLockedUntil(null);
      axios.post(lockUrl, { success: true }).catch(() => {});
      navigate("/");
      return;
    }

    // ── GAGAL — tampilkan pesan SEGERA dari hitungan lokal (tanpa nunggu server) ──
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_DURATION * 1000);
      setPassword("");
      setError(`Terlalu banyak percobaan gagal. Coba lagi dalam ${LOCK_DURATION} detik.`);
    } else {
      setError(`Username atau password salah. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`);
    }

    // ── Opsi B (server) di LATAR BELAKANG — tidak menahan UI.
    // Server tetap otoritatif: kalau username sudah terkunci (mis. lintas
    // perangkat), terapkan kuncinya begitu respons tiba.
    axios
      .post(lockUrl, { success: false })
      .then((res) => {
        if (res.data?.locked) {
          const sl = res.data.seconds_left ?? LOCK_DURATION;
          setFailedAttempts(MAX_ATTEMPTS);
          setLockedUntil(Date.now() + sl * 1000);
          setPassword("");
          setError(`Terlalu banyak percobaan gagal. Coba lagi dalam ${sl} detik.`);
        } else if (typeof res.data?.attempts_left === "number") {
          setFailedAttempts(MAX_ATTEMPTS - res.data.attempts_left);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F8] px-4">

      <div className="w-full max-w-5xl min-h-[500px] lg:h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT */}
        <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 lg:py-0 order-2 lg:order-1">

          <div className="mb-3 flex justify-center">
            <img
              src={klaktifyLogo}
              alt="Klaktify"
              className="h-24 sm:h-28 lg:h-32 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center lg:text-left">
            Sign In
          </h1>

          {/* ERROR */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-xl text-sm">
              {isLocked ? (
                <span>
                  Terlalu banyak percobaan gagal. Coba lagi dalam{" "}
                  <strong>{secondsLeft}</strong> detik.
                </span>
              ) : (
                error
              )}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin}>

            {/* USERNAME */}
            <div className="mb-6">

              <label htmlFor="username" className="text-sm text-gray-500">
                Username
              </label>

              <div className="flex items-center border-b border-gray-300 mt-1 focus-within:border-primary transition">

                <FiUser className="text-gray-400 mr-2" />

                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your Username"
                  className="w-full py-2 outline-none bg-transparent disabled:opacity-50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || isLocked}
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="mb-6">

              <label htmlFor="password" className="text-sm text-gray-500">
                Password
              </label>

              <div className="flex items-center border-b border-gray-300 mt-1 focus-within:border-primary transition">

                <FiLock className="text-gray-400 mr-2" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your Password"
                  className="w-full py-2 outline-none bg-transparent disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isLocked}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-4 bg-primary text-white py-3 rounded-full shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLocked
                ? `Tunggu ${secondsLeft}s`
                : loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

        </div>

        {/* RIGHT */}
        <div className="bg-primary flex flex-col justify-center items-center text-white py-10 lg:py-0 lg:rounded-l-[120px] order-1 lg:order-2">

          <img
            src={illustration}
            alt="login"
            className="w-40 sm:w-56 lg:w-72 mb-4 lg:mb-6"
          />

          <h2 className="text-lg sm:text-xl font-semibold">
            Welcome Back!
          </h2>

          <p className="text-xs sm:text-sm text-white/80 mt-2 text-center px-8">
            Monitoring and evaluation system for better classroom management.
          </p>

        </div>

      </div>

    </div>
  );
}