import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(new Date());

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
    <div className="fixed top-4 left-72 right-6 z-40">

      <div className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-gray-100">

        <div className="text-sm text-gray-500 flex items-center gap-3 font-medium">

          <span className="font-semibold text-gray-700">
            {formattedHours}:{minutes}:{seconds}
          </span>

          <span className="text-gray-400">
            {ampm}
          </span>

          <span className="text-gray-400">
            {formattedDate}
          </span>

        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 focus:outline-none"
          >

            <span className="text-gray-700 font-medium">
              Hello {user}
            </span>

            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 hover:border-[#A44A4A] transition">

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
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 rounded-xl transition"
              >
                Logout
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}