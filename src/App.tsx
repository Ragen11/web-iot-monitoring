import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HasilMonitoring from "./pages/HasilMonitoring";
import LaporanEvaluasi from "./pages/LaporanEvaluasi";
import InputJadwal from "./pages/InputJadwal";
import DetailMonitoring from "./pages/DetailMonitoring";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="monitoring" element={<HasilMonitoring />} />
            <Route path="LaporanEvaluasi" element={<LaporanEvaluasi />} />
            <Route path="input-jadwal" element={<InputJadwal />} />
            <Route path="monitoring/:id" element={<DetailMonitoring />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;