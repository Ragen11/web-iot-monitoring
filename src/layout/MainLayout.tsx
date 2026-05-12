import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

//import useIdleLogout from "../hooks/useIdleLogout";
import SessionTimeoutModal from "../components/SessionTimeoutModal";

export default function MainLayout() {

  // const {
  //   showModal,
  //   countdown,
  //   stayLoggedIn,
  // } = useIdleLogout();

  return (
    <>
      <div className="bg-[#F5F6FA] min-h-screen">

        <Sidebar />

        <div className="ml-72 pt-16 px-6">

          <Navbar />

          <div className="mt-6">
            <Outlet />
          </div>

        </div>

      </div>

      {/* MODAL */}
      {/* <SessionTimeoutModal
        open={showModal}
        countdown={countdown}
        onStay={stayLoggedIn}
      /> */}
    </>
  );
}