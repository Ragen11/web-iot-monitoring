import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import PageTransition from "../components/PageTransition";

import useIdleLogout from "../hooks/useIdleLogout";
import SessionTimeoutModal from "../components/SessionTimeoutModal";
import { useEffect } from "react";

export default function MainLayout() {

  const { showModal, countdown, stayLoggedIn } = useIdleLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // tutup sidebar otomatis saat pindah halaman (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="bg-[#F5F6FA] min-h-screen">

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content shift: di mobile full width, di lg ke kanan sidebar */}
        <div className="lg:ml-72 pt-16 sm:pt-20">

          <Navbar onMenuToggle={() => setSidebarOpen(true)} />

          <PageTransition />

        </div>

      </div>

      <SessionTimeoutModal
        open={showModal}
        countdown={countdown}
        onStay={stayLoggedIn}
      />
    </>
  );
}
