import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="bg-[#F5F6FA] min-h-screen flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-6">
        <Navbar />

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}