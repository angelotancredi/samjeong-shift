import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Filter, Trash2, UserPlus, List, Search, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import RankBadge from "../components/RankBadge";
import BottomNav from "../components/BottomNav";
import NotificationBell from "../components/NotificationBell";
import AddSubstituteModal from "../components/AddSubstituteModal";
import { formatDateKo, ABSENCE_REASONS, DUTY_ROLES } from "../utils/constants";
import { useModalDrag } from "../hooks/useModalDrag";

const REASON_COLORS = {
  연가:"bg-blue-100 text-blue-700", 병가:"bg-red-100 text-red-700",
  특휴:"bg-purple-100 text-purple-700", 공가:"bg-amber-100 text-amber-700",
  지각:"bg-orange-100 text-orange-700", 조퇴:"bg-pink-100 text-pink-700",
};

export default function History() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterReason, setFilterReason] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDuty, setFilterDuty] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [addSubIncident, setAddSubIncident] = useState(null);
  const [filterMissing, setFilterMissing] = useState(false);
  const [filterMyWork, setFilterMyWork] = useState(false);

  const { dragStyle: delDragStyle, bind: delBind } = useModalDrag(() => setDeleteId(null));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

  const allIncidents = useQuery(api.incidents.listByMonth, { startDate, endDate }) ?? [];
  const allUsers = useQuery(api.users.listUsers) ?? [];
  const removeIncident = useMutation(api.incidents.remove);

  const handleCloseAddSub = useCallback(() => setAddSubIncident(null), []);
  const handleDoneAddSub = useCallback(() => setAddSubIncident(null), []);

  // 당번 미정 판단
  const isPartialOrMissing = (inc) => {
    if (inc.shift !== "당번") return inc.substitutes?.length === 0;
    const hasDay = inc.substitutes?.some((s) => s.subShift === "주간");
    const hasNight = inc.substitutes?.some((s) => s.subShift === "야간");
    return !hasDay || !hasNight;
  };

  const incidents = allIncidents
    .filter((i) => !filterReason || i.reason === filterReason)
    .filter((i) => !filterTeam || String(i.user?.team) === filterTeam)
    .filter((i) => !filterDuty || i.duty === filterDuty)
    .filter((i) => !filterMissing || isPartialOrMissing(i))
    .filter((i) => !filterMyWork || (
      i.userId === profile?._id ||
      i.substitutes?.some((s) => s.substituteUserId === profile?._id)
    ))
    .sort((a, b) => b.date.localeCompare(a.date));

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

        {/* 2단: 페이지 타이틀 및 필터 */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-black tracking-tight">전체 현황</h1>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${filterReason || filterTeam || filterDuty ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
            <Filter size={13} />
            필터{(filterReason || filterTeam || filterDuty) ? " ON" : ""}
          </button>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-full active:bg-gray-200 transition-colors">
            <ChevronLeft size={18} className="text-gray-800" />
          </button>
          <span className="text-base font-bold text-black">{year}년 {month + 1}월</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-full active:bg-gray-200 transition-colors">
            <ChevronRight size={18} className="text-gray-800" />
          </button>
        </div>
        {showFilter && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs text-gray-700 w-full font-medium">사유</span>
              {ABSENCE_REASONS.map((r) => (
                <button key={r} onClick={() => setFilterReason(filterReason === r ? "" : r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${filterReason === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>{r}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <span className="text-xs text-gray-700 w-full font-medium">팀</span>
              {["1","2","3"].map((t) => (
                <button key={t} onClick={() => setFilterTeam(filterTeam === t ? "" : t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterTeam === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>{t}팀</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-700 w-full font-medium">담당 업무</span>
              {DUTY_ROLES.map((d) => (
                <button key={d} onClick={() => setFilterDuty(filterDuty === d ? "" : d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterDuty === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>{d}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 요약 */}
      <div className="flex gap-2 px-4 py-3">
        {/* 대체완료 */}
        <div className="flex-1 bg-sky-100 rounded-xl px-3 py-3 shadow-sm text-center cursor-pointer"
          onClick={() => { setFilterMissing(false); setFilterMyWork(false); }}>
          <p className="text-2xl font-bold text-sky-500">{allIncidents.filter((i) => !isPartialOrMissing(i)).length}</p>
          <p className="text-xs text-gray-600">대체완료</p>
        </div>
        {/* 대체자 미정 */}
        <div onClick={() => { setFilterMyWork(false); setFilterMissing(!filterMissing); }}
          className={`flex-1 rounded-xl px-3 py-3 shadow-sm text-center cursor-pointer transition-all ${filterMissing ? "bg-rose-500 ring-2 ring-rose-400" : "bg-rose-100"}`}>
          <p className={`text-2xl font-bold ${filterMissing ? "text-white" : "text-rose-400"}`}>
            {allIncidents.filter((i) => isPartialOrMissing(i)).length}
          </p>
          <p className={`text-xs font-medium ${filterMissing ? "text-rose-100" : "text-gray-600"}`}>
            {filterMissing ? "미정만 ✓" : "대체자 미정"}
          </p>
        </div>
        {/* 내 근무 */}
        <div onClick={() => { setFilterMissing(false); setFilterMyWork(!filterMyWork); }}
          className={`flex-1 rounded-xl px-3 py-3 shadow-sm text-center cursor-pointer transition-all ${filterMyWork ? "bg-violet-500 ring-2 ring-violet-400" : "bg-violet-100"}`}>
          <p className={`text-2xl font-bold ${filterMyWork ? "text-white" : "text-violet-500"}`}>
            {allIncidents.filter((i) =>
              i.userId === profile?._id ||
              i.substitutes?.some((s) => s.substituteUserId === profile?._id)
            ).length}
          </p>
          <p className={`text-xs font-medium ${filterMyWork ? "text-violet-100" : "text-gray-600"}`}>
            {filterMyWork ? "내 근무 ✓" : "내 근무"}
          </p>
        </div>
      </div>

      {/* 목록 */}
      <div className="px-4 flex flex-col gap-3">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <p className="text-gray-500 text-4xl">📋</p>
            <p className="text-gray-600 text-sm">등록된 사고 내역이 없습니다</p>
          </div>
        ) : incidents.map((inc) => (
          <IncidentCard
            key={inc._id}
            inc={inc}
            profile={profile}
            onDelete={() => setDeleteId(inc._id)}
            onAddSub={() => setAddSubIncident(inc)}
            isPartialOrMissing={isPartialOrMissing(inc)}
          />
        ))}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setDeleteId(null)} />
          <div
            className="relative mt-auto w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overscroll-none"
            style={delDragStyle}
          >
            <div className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" {...delBind}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
            </div>
            <div className="p-6 pt-2">
              <h3 className="font-bold text-lg text-black mb-2">삭제하시겠습니까?</h3>
              <p className="text-gray-700 text-sm mb-5">이 내역을 삭제하면 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-800">취소</button>
                <button onClick={async () => { await removeIncident({ id: deleteId }); setDeleteId(null); }}
                  className="flex-1 py-3.5 bg-red-500 rounded-xl font-semibold text-white">삭제</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 대체자 지정 모달 */}
      {addSubIncident && (
        <AddSubstituteModal
          incident={addSubIncident}
          users={allUsers}
          onClose={handleCloseAddSub}
          onDone={handleDoneAddSub}
        />
      )}

      <BottomNav />
    </div>
  );
}

function IncidentCard({ inc, profile, onDelete, onAddSub, isPartialOrMissing }) {
  const [deleteSubInfo, setDeleteSubInfo] = useState(null);
  const isDuty = inc.shift === "당번";
  const daySub = inc.substitutes?.find((s) => s.subShift === "주간");
  const nightSub = inc.substitutes?.find((s) => s.subShift === "야간");
  const singleSub = !isDuty && inc.substitutes?.[0];
  const removeSubstitute = useMutation(api.substitutes.removeSubstitute);

  const { dragStyle: subDelDragStyle, bind: subDelBind } = useModalDrag(() => setDeleteSubInfo(null));

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <RankBadge rank={inc.user?.rank} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-black">{inc.user?.name}</span>
            <span className="text-xs text-gray-600">{inc.user?.team}팀</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${REASON_COLORS[inc.reason] || "bg-gray-100 text-gray-800"}`}>
              {inc.reason}
              {(inc.reason === "지각" || inc.reason === "조퇴") && inc.startTime && inc.endTime && (
                <span className="ml-1 text-orange-600">
                  {inc.startTime.split(':')[0]}~{inc.endTime.split(':')[0]}
                </span>
              )}
            </span>
            {inc.shift && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{inc.shift}</span>}
            {inc.duty && <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{inc.duty}</span>}
          </div>
          <p className="text-xs text-gray-600 mt-1">{formatDateKo(inc.date + "T00:00:00")}</p>
          {inc.note && <p className="text-xs text-gray-700 mt-1">{inc.note}</p>}
        </div>
        {(profile?.isAdmin || profile?._id === inc.registeredBy) && (
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-400">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* 대체 정보 */}
      <div className="mt-1 pt-2 border-t border-gray-100">
        {inc.reason === "지각" || inc.reason === "조퇴" ? (
          // 지각/조퇴: 대체자 있으면 표시, 없으면 미정 + 등록 버튼
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              {singleSub ? (
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0" />
                  <span className="w-7 shrink-0" />
                  <span className="text-xs font-bold text-blue-400 shrink-0">→</span>
                  <RankBadge rank={singleSub.user?.rank} size="sm" />
                  <span className="text-sm font-semibold text-gray-900">{singleSub.user?.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">{singleSub.user?.team}팀</span>
                  {(profile?.isAdmin || profile?._id === inc.registeredBy) && (
                    <button onClick={() => setDeleteSubInfo({ incidentId: inc._id })}
                      className="ml-auto text-red-400 hover:text-red-600 transition-colors p-0.5">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0" />
                  <span className="w-7 shrink-0" />
                  <span className="text-xs font-bold text-blue-400 shrink-0">→</span>
                  <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full font-bold">대체자 미정</span>
                </div>
              )}
            </div>
            {!singleSub && (
              <button onClick={onAddSub}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full shrink-0 active:scale-95 transition-transform">
                <UserPlus size={12} />
                대체자 등록
              </button>
            )}
          </div>
        ) : isDuty ? (
          // 당번: 주간/야간 각각 표시
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
               <SubRow label="주간" sub={daySub} missing={!daySub}
                onRemove={daySub && (profile?.isAdmin || profile?._id === inc.registeredBy) ? () => setDeleteSubInfo({ incidentId: inc._id, subShift: "주간" }) : undefined} />
              <SubRow label="야간" sub={nightSub} missing={!nightSub}
                onRemove={nightSub && (profile?.isAdmin || profile?._id === inc.registeredBy) ? () => setDeleteSubInfo({ incidentId: inc._id, subShift: "야간" }) : undefined} />
            </div>
            {isPartialOrMissing && (
              <button onClick={onAddSub}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full shrink-0 active:scale-95 transition-transform">
                <UserPlus size={12} />
                대체자 등록
              </button>
            )}
          </div>
        ) : singleSub ? (
          // 주간/야간: 단일 대체자
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0" />
            <span className="w-7 shrink-0" />
            <span className="text-xs font-bold text-blue-400 shrink-0">→</span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <RankBadge rank={singleSub.user?.rank} size="sm" />
              <span className="text-sm font-semibold text-gray-900 truncate">{singleSub.user?.name}</span>
              <span className="text-xs text-gray-500 shrink-0">{singleSub.user?.team}팀</span>
               {(profile?.isAdmin || profile?._id === inc.registeredBy) && (
                <button onClick={() => setDeleteSubInfo({ incidentId: inc._id })}
                  className="ml-auto text-red-400 hover:text-red-600 transition-colors p-0.5">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          // 미정
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0" />
              <span className="w-7 shrink-0" />
              <span className="text-xs font-bold text-blue-400 shrink-0">→</span>
              <span className="text-xs text-orange-400 bg-orange-50 font-bold px-2 py-1 rounded-full">대체자 미정</span>
            </div>
            <button onClick={onAddSub}
              className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1.5 bg-blue-50 rounded-full active:scale-95 transition-transform">
              <UserPlus size={12} />
              대체자 등록
            </button>
          </div>
        )}
      </div>

      {/* 대체자 삭제 확인 모달 */}
      {deleteSubInfo && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setDeleteSubInfo(null)} />
          <div
            className="relative mt-auto w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overscroll-none"
            style={subDelDragStyle}
          >
            <div className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" {...subDelBind}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
            </div>
            <div className="p-6 pt-2">
              <h3 className="font-bold text-lg text-black mb-2">대체자를 삭제하시겠습니까?</h3>
              <p className="text-gray-700 text-sm mb-5">이 대체자 정보를 삭제하면 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteSubInfo(null)} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-800">취소</button>
                <button onClick={async () => { await removeSubstitute(deleteSubInfo); setDeleteSubInfo(null); }}
                  className="flex-1 py-3.5 bg-red-500 rounded-xl font-semibold text-white">삭제</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubRow({ label, sub, missing, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0" />
      <span className="text-xs text-gray-500 w-7 shrink-0 text-right">{label || ""}</span>
      <span className="text-xs font-bold text-blue-400 shrink-0">→</span>
      {sub ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <RankBadge rank={sub.user?.rank} size="sm" />
          <span className="text-sm font-semibold text-gray-900 truncate">{sub.user?.name}</span>
          <span className="text-xs text-gray-500 shrink-0">{sub.user?.team}팀</span>
          {onRemove && (
            <button onClick={onRemove}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors p-0.5">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ) : (
        <span className="text-xs text-orange-400 font-bold bg-orange-50 px-2 py-0.5 rounded-full">대체자 미정</span>
      )}
    </div>
  );
}
