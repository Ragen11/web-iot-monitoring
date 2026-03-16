import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import illustration from "../assets/login.png";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    const success = login(username, password);
    if (success) {
      navigate("/");
    } else {
      setError("Username atau password salah");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F8] px-4">
      
      {/* FRAME CARD */}
      <div className="w-full max-w-5xl h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-2">

        {/* ========================= */}
        {/* LEFT SIDE - FORM */}
        {/* ========================= */}
        <div className="flex flex-col justify-center px-16">

          {/* LOGO */}
          <div className="mb-8 flex justify-center">
            <span className="bg-[#E7C5C5] text-[#A44A4A] px-6 py-2 rounded-xl font-semibold text-sm">
              MonitoringClass
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Sign In
          </h1>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {/* USERNAME */}
          <div className="mb-6">
            <label className="text-sm text-gray-500">Username</label>
            <div className="flex items-center border-b border-gray-300 mt-1">
              <FiUser className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Enter your Username"
                className="w-full py-2 outline-none bg-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="text-sm text-gray-500">Password</label>
            <div className="flex items-center border-b border-gray-300 mt-1">
              <FiLock className="text-gray-400 mr-2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                className="w-full py-2 outline-none bg-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="mt-4 bg-[#A44A4A] text-white py-3 rounded-full shadow-lg hover:opacity-90 transition"
          >
            Login
          </button>
        </div>

        {/* ========================= */}
        {/* RIGHT SIDE - ILLUSTRATION */}
        {/* ========================= */}
        <div className="bg-[#A44A4A] flex flex-col justify-center items-center text-white rounded-l-[120px]">

          <img
            src={illustration}
            alt="login"
            className="w-72 mb-6"
          />

          <h2 className="text-xl font-semibold">
            Welcome Back!
          </h2>

          <p className="text-sm text-white/80 mt-2 text-center px-8">
            Monitoring and evaluation system for better classroom management.
          </p>
        </div>
      </div>
    </div>
  );
}