import { NavLink } from "react-router-dom";
import { FiHome, FiBarChart2, FiFileText, FiSettings, FiCalendar } from "react-icons/fi";
import { useAuth } from "../auth/useAuth";

const menu = [
  { name: "Dashboard", icon: <FiHome />, path: "/" },
  { name: "Hasil Monitoring", icon: <FiBarChart2 />, path: "/monitoring" },
  { name: "Laporan Evaluasi", icon: <FiFileText />, path: "/LaporanEvaluasi" },
];

export default function Sidebar() {

  const { role } = useAuth();

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-[#A44A4A] text-white flex flex-col p-6 rounded-r-3xl">

      <h1 className="text-xl font-bold mb-10">MonitoringClass</h1>

      <div className="space-y-4">

        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : "opacity-80 hover:bg-white/20 hover:text-white hover:shadow-sm hover:-translate-y-0.5"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}

        {/* ADMIN ONLY */}
        {role === "admin" && (
          <NavLink
            to="/input-jadwal"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : "opacity-80 hover:bg-white/20 hover:text-white hover:shadow-sm hover:-translate-y-0.5"
              }`
            }
          >
            <FiCalendar />
            Input Jadwal
          </NavLink>
        )}

      </div>

      <div className="mt-auto flex items-center gap-3 opacity-80">
        <FiSettings /> Setting
      </div>
    </div>
  );
}