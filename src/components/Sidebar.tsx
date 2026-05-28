import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiCalendar,
  FiBook,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../auth/useAuth";
import logoWhite from "../assets/klaktify-logo-notagline-white.png";

const menu = [
  { name: "Dashboard",         icon: <FiHome />,      path: "/" },
  { name: "Hasil Monitoring",  icon: <FiBarChart2 />, path: "/monitoring" },
  { name: "Laporan Evaluasi",  icon: <FiFileText />,  path: "/LaporanEvaluasi" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// helper untuk class NavLink (DRY)
const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
    isActive
      ? "bg-white text-[#A44A4A] shadow-sm"
      : "text-white/80 hover:bg-white/20 hover:text-white"
  }`;

export default function Sidebar({ isOpen, onClose }: Props) {

  const { role } = useAuth();

  return (
    <>
      {/* BACKDROP mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-4 bottom-4 left-4 z-50
          w-64 bg-[#A44A4A] text-white flex flex-col p-6 rounded-3xl shadow-lg
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-[110%]"}
          lg:translate-x-0
        `}
      >
        {/* Header dengan tombol close (mobile) */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 flex justify-center">
            <img
              src={logoWhite}
              alt="Klaktify"
              className="h-10 w-auto object-contain -ml-3"
            />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/20 transition shrink-0"
            aria-label="Tutup menu"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {menu.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={navClass}
              onClick={onClose}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}

          {role === "admin" && (
            <>
              <NavLink to="/input-jadwal" className={navClass} onClick={onClose}>
                <FiCalendar />
                <span className="text-sm font-medium">Input Jadwal</span>
              </NavLink>

              <NavLink to="/input-rps" className={navClass} onClick={onClose}>
                <FiBook />
                <span className="text-sm font-medium">Input RPS</span>
              </NavLink>
            </>
          )}
        </div>

        <NavLink
          to="/setting"
          className={({ isActive }) =>
            `mt-auto ${navClass({ isActive })}`
          }
          onClick={onClose}
        >
          <FiSettings />
          <span className="text-sm font-medium">Setting</span>
        </NavLink>
      </div>
    </>
  );
}
