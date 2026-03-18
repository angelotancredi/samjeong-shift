import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, UserPlus } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import RankBadge from "../components/RankBadge";
import BottomNav from "../components/BottomNav";
import { getDutyTeam, toDateString, formatDateKo } from "../utils/constants";
import AddSubstituteModal from "../components/AddSubstituteModal";

const TEAM_COLORS = {
  1: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  2: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  3: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
};

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [addSubIncident, setAddSubIncident] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDate = toDateString(new Date(year, month, 1));
  const endDate = toDateString(new Date(year, month + 1, 0));

  const incidents = useQuery(api.incidents.listByMonth, { startDate, endDate }) ?? [];
  const allUsers = useQuery(api.users.listUsers) ?? [];
  const cycleBase = useQuery(api.dutyCycle.get) ?? null;

  const today = new Date();
  const todayStr = toDateString(today);
  // 오늘 현황 전용 쿼리 (달력 이동과 독립적으로 항상 오늘 데이터 유지)
  const todayIncidents = useQuery(api.incidents.listByMonth, { startDate: todayStr, endDate: todayStr }) ?? [];

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getIncidentsForDay = (day) => {
    const dateStr = toDateString(new Date(year, month, day));
    return incidents.filter((i) => i.date === dateStr);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDate(new Date(year, month, day));
    setShowModal(true);
  };

  const days = getDaysInMonth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 shadow-sm">
        {/* 상단 정보 영역 (개편된 레이아웃) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <p className="text-sm text-gray-900 font-bold tracking-tight">삼정119안전센터</p>
            </div>
             {profile && (
               <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                 <span className="text-[12px] text-blue-600 font-bold">{profile.rank}</span>
                 <span className="text-[12px] text-gray-900 font-bold">{profile.name}</span>
               </div>
             )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => window.location.reload()} className="p-2 text-blue-600 hover:text-blue-500 transition-colors">
              <RefreshCw size={18} />
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* 네비게이션 영역 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
              <ChevronLeft size={20} className="text-gray-900" />
            </button>
            <h2 className="text-lg font-bold text-black tracking-tight">{year}년 {month + 1}월</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
              <ChevronRight size={20} className="text-gray-900" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-gray-50 pt-2">
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-bold py-1 ${i===0?"text-red-400":i===6?"text-blue-400 text-opacity-80":"text-gray-400 uppercase"}`}>{d}</div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white px-3">
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateObj = day ? new Date(year, month, day) : null;
            const dateStr = dateObj ? toDateString(dateObj) : null;
            const dayIncidents = day ? getIncidentsForDay(day) : [];
            const dutyTeam = dateObj && cycleBase ? getDutyTeam(dateObj, cycleBase) : null;
            const isToday = dateStr === todayStr;
            const isSun = idx % 7 === 0;
            const isSat = idx % 7 === 6;
            const tc = dutyTeam ? TEAM_COLORS[dutyTeam] : null;
            return (
              <div key={idx} onClick={() => handleDayClick(day)}
                className={`h-[75px] p-1 border-b border-gray-50 overflow-hidden ${day ? "cursor-pointer active:bg-blue-50" : ""}`}>
                {day && (
                  <>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${isToday?"bg-blue-600 text-white":isSun?"text-red-400":isSat?"text-blue-500":"text-gray-900"}`}>
                        {day}
                      </span>
                      {dutyTeam && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>{dutyTeam}팀</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                      {dayIncidents.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      ))}
                      {dayIncidents.length > 3 && <span className="text-[8px] text-gray-600">+{dayIncidents.length-3}</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today summary */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-black text-sm">오늘 현황</h3>
            <span className="text-xs text-gray-600">{formatDateKo(today)}</span>
          </div>
          {(() => {
              const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const dutyTeam = cycleBase ? getDutyTeam(normalizedToday, cycleBase) : null;
            const tc = dutyTeam ? TEAM_COLORS[dutyTeam] : null;
            return (
              <div>
                {dutyTeam && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3 ${tc.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                    <span className={`text-xs font-bold ${tc.text}`}>{dutyTeam}팀 당번</span>
                  </div>
                )}
                {todayIncidents.length === 0 ? (
                  <p className="text-sm text-gray-600">오늘 등록된 사고자가 없습니다</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayIncidents.map((inc) => (
                      <div key={inc._id} className="bg-gray-50 rounded-xl p-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <RankBadge rank={inc.user?.rank} size="sm" />
                          <span className="text-sm font-medium text-black">{inc.user?.name}</span>
                          <span className="text-xs text-gray-500">
                            ({inc.reason}
                            {(inc.reason === "지각" || inc.reason === "조퇴") && inc.startTime && inc.endTime && ` ${inc.startTime}~${inc.endTime}`}
                            {inc.shift && ` · ${inc.shift}`})
                          </span>
                          {inc.duty && <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{inc.duty}</span>}
                        </div>
                        <SubstituteDisplay inc={inc} onAddSub={() => setAddSubIncident(inc)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

       {/* FAB */}
       <button onClick={() => navigate("/incident-register")}
         className="fixed right-5 bottom-[94px] w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30">
         <Plus size={26} className="text-white" strokeWidth={2.5} />
       </button>

      {/* Day modal */}
      {showModal && selectedDate && (
        <DayModal
          date={selectedDate}
          incidents={incidents.filter((i) => i.date === toDateString(selectedDate))}
          allUsers={allUsers}
          cycleBase={cycleBase}
          onClose={() => setShowModal(false)}
          onAdd={() => { setShowModal(false); navigate("/incident-register", { state: { date: toDateString(selectedDate) } }); }}
          setAddSubIncident={setAddSubIncident}
        />
      )}
      {addSubIncident && (
        <AddSubstituteModal
          incident={addSubIncident}
          users={allUsers}
          onClose={() => setAddSubIncident(null)}
          onDone={() => setAddSubIncident(null)}
        />
      )}
      <BottomNav />
    </div>
  );
}

function DayModal({ date, incidents, allUsers, cycleBase, onClose, onAdd, setAddSubIncident }) {
  const dutyTeam = cycleBase ? getDutyTeam(date, cycleBase) : null;
  const tc = dutyTeam ? { 1:{text:"text-blue-700"}, 2:{text:"text-emerald-700"}, 3:{text:"text-violet-700"} }[dutyTeam] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative mt-auto bg-white rounded-t-[32px] h-[80vh] flex flex-col animate-slide-up shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-black">{formatDateKo(date)}</h3>
              {dutyTeam && <span className={`text-xs font-bold ${tc.text}`}>{dutyTeam}팀 당번</span>}
            </div>
            <button onClick={onAdd} className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-xl active:scale-95 transition-transform">
              <Plus size={14} />등록
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          {incidents.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">등록된 사고자가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {incidents.map((inc) => (
                <div key={inc._id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <RankBadge rank={inc.user?.rank} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black truncate">{inc.user?.name}</p>
                        <p className="text-xs text-gray-700">{inc.user?.team}팀 · {inc.user?.rank}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-1 rounded-full">
                          {inc.reason}
                          {(inc.reason === "지각" || inc.reason === "조퇴") && inc.startTime && inc.endTime && (
                            <span className="ml-1">{inc.startTime}~{inc.endTime}</span>
                          )}
                        </span>
                        {inc.shift && <span className="text-xs bg-gray-200 text-gray-600 font-medium px-2 py-1 rounded-full">{inc.shift}</span>}
                        {inc.duty && <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-1 rounded-full">{inc.duty}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <SubstituteDisplay inc={inc} onAddSub={() => setAddSubIncident(inc)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 대체근무자 표시 (당번: 주간/야간 분리, 그 외: 단일)
function SubstituteDisplay({ inc, onAddSub }) {
  const isDuty = inc.shift === "당번";
  const isLateLeave = inc.reason === "지각" || inc.reason === "조퇴";
  const daySub = inc.substitutes?.find((s) => s.subShift === "주간");
  const nightSub = inc.substitutes?.find((s) => s.subShift === "야간");
  const singleSub = !isDuty && inc.substitutes?.[0];
  const hasAll = isDuty ? (daySub && nightSub) : singleSub;

  // 지각/조퇴 처리
  if (isLateLeave) {
    const label = inc.reason === "지각" ? "지각" : "조퇴";
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">{label}</span>
            <span className="text-xs text-orange-400 bg-orange-50 px-3 py-0.5 rounded-full font-bold">대체자 미정</span>
          </div>
        </div>
        <button onClick={onAddSub}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full shrink-0 active:scale-95 transition-transform">
          <UserPlus size={12} />
          대체자 등록
        </button>
      </div>
    );
  }

  if (isDuty) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 flex-1">
          {[{ label:"🌞 주간", sub: daySub }, { label:"🌙 야간", sub: nightSub }].map(({ label, sub }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-14">{label}</span>
              {sub ? (
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={sub.user?.rank} size="sm" />
                  <span className="text-sm font-medium text-gray-900">{sub.user?.name}</span>
                </div>
              ) : (
                <span className="text-xs text-orange-400 bg-orange-50 px-3 py-0.5 rounded-full font-bold">대체자 미정</span>
              )}
            </div>
          ))}
        </div>
        {!hasAll && (
          <button onClick={onAddSub}
            className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full shrink-0 active:scale-95 transition-transform">
            <UserPlus size={12} />
            대체자 등록
          </button>
        )}
      </div>
    );
  }

  if (singleSub) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-14">대체</span>
        <RankBadge rank={singleSub.user?.rank} size="sm" />
        <span className="text-sm font-medium text-gray-900">{singleSub.user?.name}</span>
        <span className="text-xs text-gray-500">{singleSub.user?.team}팀</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-orange-400 bg-orange-50 font-bold px-3 py-1 rounded-full">대체자 미정</span>
      <button onClick={onAddSub}
        className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full">
        <UserPlus size={12} />
        대체자 등록
      </button>
    </div>
  );
}
