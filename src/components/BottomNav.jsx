import { useLocation, useNavigate } from "react-router-dom";
import { Home, List, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/", icon: Home, label: "홈" },
  { path: "/history", icon: List, label: "현황" },
  { path: "/mypage", icon: User, label: "내 기록" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const items = profile?.isAdmin
    ? [...navItems, { path: "/admin", icon: Settings, label: "관리자" }]
    : navItems;

  return (
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
        {/* 로그아웃 버튼 추가 */}
        <button
          onClick={() => { if(window.confirm("로그아웃 하시겠습니까?")) { logout(); navigate("/login"); } }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
