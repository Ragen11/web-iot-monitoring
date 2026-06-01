import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  onMenuToggle: () => void;
};

export default function Navbar({ onMenuToggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen]               = useState(false);
  const [time, setTime]               = useState(new Date());
  const [confirmLogout, setConfirmLogout] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoutConfirm = () => {
    setConfirmLogout(false);
    handleLogout();
  };

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const formattedHours = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="fixed top-4 left-4 right-4 lg:left-72 z-30">

        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-sm border border-gray-100">

          {/* LEFT: hamburger (mobile) + clock */}
          <div className="flex items-center gap-3 min-w-0">

            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition shrink-0"
              aria-label="Buka menu"
            >
              <FiMenu size={20} className="text-gray-700" />
            </button>

            <div className="text-sm flex items-center gap-2 font-medium min-w-0">

              <span className="font-semibold text-gray-700 shrink-0">
                {formattedHours}:{minutes}:{seconds}
              </span>

              <span className="text-gray-500 shrink-0">
                {ampm}
              </span>

              <span className="hidden sm:inline text-gray-300 mx-1">|</span>

              <span className="hidden sm:inline text-gray-400 truncate">
                {formattedDate}
              </span>

            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 focus:outline-none"
            >

              <span className="hidden sm:inline text-gray-700 font-medium truncate max-w-[120px]">
                Hello {user}
              </span>

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-gray-200 hover:border-primary transition shrink-0">

                <img
                  src="https://i.pravatar.cc/100"
                  alt="profile"
                  className="w-full h-full object-cover"
                />

              </div>

            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-md border border-gray-100">
                <button
                  onClick={() => { setOpen(false); setConfirmLogout(true); }}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-100 rounded-xl transition"
                >
                  Logout
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Konfirmasi Logout"
        message="Anda akan keluar dari sesi ini. Lanjutkan?"
        confirmLabel="Ya, Logout"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}