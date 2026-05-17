import { NavLink } from "react-router-dom";
import { FiHome, FiBarChart2, FiFileText, FiSettings, FiCalendar, FiBook } from "react-icons/fi";
import { useAuth } from "../auth/useAuth";

const menu = [
  { name: "Dashboard", icon: <FiHome />, path: "/" },
  { name: "Hasil Monitoring", icon: <FiBarChart2 />, path: "/monitoring" },
  { name: "Laporan Evaluasi", icon: <FiFileText />, path: "/LaporanEvaluasi" },
];

export default function Sidebar() {

  const { role } = useAuth();

  return (
    <div className="w-64 h-[calc(100vh-2rem)] fixed left-4 top-4 bg-[#A44A4A] text-white flex flex-col p-6 rounded-3xl shadow-lg">

      {/* Title */}
      <h1 className="text-lg font-semibold mb-10 tracking-wide text-center">
        MonitoringClass
      </h1>

      <div className="space-y-3">

        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-white text-[#A44A4A] shadow-sm"
                  : "text-white/80 hover:bg-white/20 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span className="text-sm font-medium">
              {item.name}
            </span>
          </NavLink>
        ))}

        {role === "admin" && (
          <>
            <NavLink
              to="/input-jadwal"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-white text-[#A44A4A] shadow-sm"
                    : "text-white/80 hover:bg-white/20 hover:text-white"
                }`
              }
            >
              <FiCalendar />
              <span className="text-sm font-medium">Input Jadwal</span>
            </NavLink>

            <NavLink
              to="/input-rps"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-white text-[#A44A4A] shadow-sm"
                    : "text-white/80 hover:bg-white/20 hover:text-white"
                }`
              }
            >
              <FiBook />
              <span className="text-sm font-medium">Input RPS</span>
            </NavLink>
          </>
        )}

      </div>

      <NavLink
        to="/setting"
        className={({ isActive }) =>
          `mt-auto flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-white text-[#A44A4A] shadow-sm"
              : "text-white/70 hover:bg-white/20 hover:text-white"
          }`
        }
      >
        <FiSettings />
        <span className="text-sm font-medium">Setting</span>
      </NavLink>
    </div>
  );
}