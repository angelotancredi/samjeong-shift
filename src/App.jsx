import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import PushPermissionBanner from "./components/PushPermissionBanner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import IncidentRegister from "./pages/IncidentRegister";
import History from "./pages/History";
import MyPage from "./pages/MyPage";
import Admin from "./pages/Admin";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-white font-medium animate-pulse">데이터를 불러오는 중...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <PushPermissionBanner />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><NotificationProvider><Home /></NotificationProvider></ProtectedRoute>} />
        <Route path="/incident-register" element={<ProtectedRoute><NotificationProvider><IncidentRegister /></NotificationProvider></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><NotificationProvider><History /></NotificationProvider></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><NotificationProvider><MyPage /></NotificationProvider></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><NotificationProvider><Admin /></NotificationProvider></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
