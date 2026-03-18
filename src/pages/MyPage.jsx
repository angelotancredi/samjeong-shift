import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronRight, List, Calendar, Bell, RefreshCw, Users, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import RankBadge from "../components/RankBadge";
import BottomNav from "../components/BottomNav";
import NotificationBell from "../components/NotificationBell";
import { formatDateKo } from "../utils/constants";
import { useState } from "react";

const REASON_COLORS = {
  연가:"bg-blue-100 text-blue-700", 병가:"bg-red-100 text-red-700",
  특휴:"bg-purple-100 text-purple-700", 공가:"bg-amber-100 text-amber-700",
  지각:"bg-orange-100 text-orange-700", 조퇴:"bg-pink-100 text-pink-700",
};

export default function MyPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("incidents");

  const myIncidents = useQuery(api.incidents.listByUser, profile ? { userId: profile._id } : "skip") ?? [];

  // 내가 대체한 기록: substitutes 테이블에서 substitute_user_id === profile._id
  // incidents.listByMonth 대신 전용 쿼리 사용
  const mySubstitutes = useQuery(
    api.incidents.listSubstitutesByUser,
    profile ? { userId: profile._id } : "skip"
  ) ?? [];

  const thisYear = new Date().getFullYear();
  const thisYearSubs = mySubstitutes.filter(
    (s) => new Date(s._creationTime).getFullYear() === thisYear
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 shadow-sm">
        {/* 1단: 상단 정보 영역 (표준) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <p className="text-sm text-gray-900 font-bold tracking-tight">삼정119안전센터</p>
            </div>
            {profile && (
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                <span className="text-sm text-blue-600 font-bold">{profile.rank}</span>
                <span className="text-sm text-gray-900 font-bold">{profile.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => window.location.reload()} className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
              <RefreshCw size={18} />
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* 2단: 페이지 타이틀 */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-black tracking-tight">내 기록</h1>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
          <RankBadge rank={profile?.rank} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-black">{profile?.name}</h2>
              {profile?.isAdmin && <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">관리자</span>}
            </div>
            <p className="text-sm text-gray-700">{profile?.team}팀 · {profile?.rank}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4">
        {[
          { icon: Calendar, color:"text-red-400", value: myIncidents.length, label:"내 사고" },
          { icon: Users, color:"text-blue-400", value: mySubstitutes.length, label:"대체 근무" },
          { icon: TrendingUp, color:"text-green-400", value: thisYearSubs, label:"올해 대체" },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon size={14} className={color} />
              <p className="text-xs text-gray-600 font-medium">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${value > 0 ? "text-black" : "text-gray-500"}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex mx-4 mb-4 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab("incidents")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "incidents" ? "bg-white text-black shadow-sm" : "text-gray-600"}`}>
          내 사고 ({myIncidents.length})
        </button>
        <button onClick={() => setTab("substitutes")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "substitutes" ? "bg-white text-black shadow-sm" : "text-gray-600"}`}>
          대체 ({mySubstitutes.length})
        </button>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {tab === "incidents" ? (
          myIncidents.length === 0 ? <EmptyState text="사고 기록이 없습니다" /> :
          myIncidents.map((inc) => (
            <div key={inc._id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">{formatDateKo(inc.date + "T00:00:00")}</p>
                <div className="flex gap-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${REASON_COLORS[inc.reason] || "bg-gray-100 text-gray-600"}`}>{inc.reason}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{inc.shift}</span>
                </div>
              </div>
              {inc.substitutes?.length > 0 ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-600">대체:</span>
                  <RankBadge rank={inc.substitutes[0].user?.rank} size="sm" />
                  <span className="text-sm font-medium text-gray-900">{inc.substitutes[0].user?.name}</span>
                </div>
              ) : <span className="text-xs bg-orange-50 text-orange-400 font-bold px-3 py-1 rounded-full mt-2 inline-block">대체자 미정</span>}
            </div>
          ))
        ) : (
          mySubstitutes.length === 0 ? <EmptyState text="대체 근무 기록이 없습니다" /> :
          mySubstitutes.map((sub) => (
            <div key={sub._id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">{sub.date ? formatDateKo(sub.date + "T00:00:00") : "-"}</p>
                <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">대체완료</span>
              </div>
              <div className="flex items-center gap-2">
                <RankBadge rank={sub.incidentUser?.rank} size="sm" />
                <div>
                  <span className="text-sm font-medium text-gray-800">{sub.incidentUser?.name}</span>
                  <span className="text-xs text-gray-600 ml-1">({sub.reason} · {sub.shift})</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center py-14 gap-2">
      <p className="text-gray-500 text-4xl">📋</p>
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}
