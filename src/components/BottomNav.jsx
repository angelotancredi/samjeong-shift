import { useLocation, useNavigate } from "react-router-dom";
import { Home, List, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const navItems = [
  { path: "/", icon: Home, label: "홈" },
  { path: "/history", icon: List, label: "현황" },
  { path: "/mypage", icon: User, label: "내 기록" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const items = profile?.isAdmin
    ? [...navItems, { path: "/admin", icon: Settings, label: "관리자" }]
    : navItems;

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
        <div className="flex max-w-lg mx-auto">
          {items.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  active ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-blue-600" : "text-gray-400"}
                />
                <span className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </button>
            );
          })}
          {/* 로그아웃 버튼 */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">로그아웃</span>
          </button>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm shadow-lg">
            <h2 className="text-lg font-bold text-black mb-2">로그아웃 하시겠어요?</h2>
            <p className="text-sm text-gray-600 mb-6">로그아웃하면 다시 로그인해야 합니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
