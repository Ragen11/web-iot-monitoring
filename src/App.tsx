import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HasilMonitoring from "./pages/HasilMonitoring";
import LaporanEvaluasi from "./pages/LaporanEvaluasi";
import InputJadwal from "./pages/InputJadwal";
import InputRPS from "./pages/InputRPS";
import DetailMonitoring from "./pages/DetailMonitoring";
import Setting from "./pages/Setting";
import TahunAjaran from "./pages/TahunAjaran";
import PengaturanPertemuan from "./pages/PengaturanPertemuan";

import { AuthProvider } from "./auth/AuthContext";
import { TahunAjaranProvider } from "./context/TahunAjaranContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TahunAjaranProvider>
                  <MainLayout />
                </TahunAjaranProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="monitoring" element={<HasilMonitoring />} />
            <Route path="LaporanEvaluasi" element={<LaporanEvaluasi />} />
            <Route
              path="input-jadwal"
              element={
                <AdminRoute>
                  <InputJadwal />
                </AdminRoute>
              }
            />
            <Route
              path="input-rps"
              element={
                <AdminRoute>
                  <InputRPS />
                </AdminRoute>
              }
            />
            <Route
              path="tahun-ajaran"
              element={
                <AdminRoute>
                  <TahunAjaran />
                </AdminRoute>
              }
            />
            <Route
              path="pengaturan-pertemuan"
              element={
                <AdminRoute>
                  <PengaturanPertemuan />
                </AdminRoute>
              }
            />
            <Route path="setting" element={<Setting />} />
            <Route path="monitoring/:id" element={<DetailMonitoring />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;