import { useState, useEffect, useRef } from "react";
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

export default function Login() {

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (loading) return;
    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong");
      return;
    }

    setError("");
    setLoading(true);

    const success = await login(username, password);

    setLoading(false);

    if (success) {
      navigate("/");
    } else {
      setError("Username atau password salah");
    }
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
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin}>

            {/* USERNAME */}
            <div className="mb-6">

              <label htmlFor="username" className="text-sm text-gray-500">
                Username
              </label>

              <div className="flex items-center border-b border-gray-300 mt-1 focus-within:border-[#A44A4A] transition">

                <FiUser className="text-gray-400 mr-2" />

                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your Username"
                  className="w-full py-2 outline-none bg-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="mb-6">

              <label htmlFor="password" className="text-sm text-gray-500">
                Password
              </label>

              <div className="flex items-center border-b border-gray-300 mt-1 focus-within:border-[#A44A4A] transition">

                <FiLock className="text-gray-400 mr-2" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your Password"
                  className="w-full py-2 outline-none bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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
              disabled={loading}
              className="w-full mt-4 bg-[#A44A4A] text-white py-3 rounded-full shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

        </div>

        {/* RIGHT */}
        <div className="bg-[#A44A4A] flex flex-col justify-center items-center text-white py-10 lg:py-0 lg:rounded-l-[120px] order-1 lg:order-2">

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