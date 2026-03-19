import { useState } from "react";
import { Check } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import RankBadge from "./RankBadge";
import { useAuth } from "../context/AuthContext";
import { formatDateKo } from "../utils/constants";
import { useModalDrag } from "../hooks/useModalDrag";

export default function AddSubstituteModal({ incident, users, onClose, onDone }) {
  const { profile } = useAuth();
  const isDuty = incident?.shift === "당번";
  const addSubstitute = useMutation(api.substitutes.addSubstitute);
  const addSubstituteDuty = useMutation(api.substitutes.addSubstituteDuty);

  const { dragStyle, bind } = useModalDrag(onClose);

  // 기존 대기자 정보
  const existingDay = incident?.substitutes?.find((s) => s.subShift === "주간");
  const existingNight = incident?.substitutes?.find((s) => s.subShift === "야간");
  const existingSingle = !isDuty && incident?.substitutes?.[0];

  // 이미 등록된 슬롯 여부
  const dayLocked = !!existingDay;
  const nightLocked = !!existingNight;

  // 본인만 목록에 표시, 기본값은 미선택(null)
  const filtered = users.filter((u) => u._id === profile?._id);

  const [selectedId, setSelectedId] = useState(null); // 기본 미선택

  const [activeSlot, setActiveSlot] = useState(
    dayLocked && !nightLocked ? "night" : "day" // 주간 잠김이면 야간으로 시작
  );
  const [dayId, setDayId] = useState(existingDay?.user?._id ?? existingDay?.substituteUserId ?? null);
  const [dayUser, setDayUser] = useState(existingDay?.user ?? null);
  const [nightId, setNightId] = useState(existingNight?.user?._id ?? existingNight?.substituteUserId ?? null);
  const [nightUser, setNightUser] = useState(existingNight?.user ?? null);

  const [loading, setLoading] = useState(false);

  const handleSelectDuty = (u) => {
    if (activeSlot === "day") {
      if (dayId === u._id) { setDayId(null); setDayUser(null); }
      else { setDayId(u._id); setDayUser(u); }
    } else {
      if (nightId === u._id) { setNightId(null); setNightUser(null); }
      else { setNightId(u._id); setNightUser(u); }
    }
  };

  const isSelectedDuty = (u) =>
    (activeSlot === "day" && dayId === u._id) ||
    (activeSlot === "night" && nightId === u._id);

  const canConfirm = isDuty ? (dayId || nightId) : selectedId;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      if (isDuty) {
        await addSubstituteDuty({
          incidentId: incident._id,
          dayUserId: dayId || undefined,
          nightUserId: nightId || undefined,
        });
      } else {
        await addSubstitute({
          incidentId: incident._id,
          substituteUserId: selectedId,
        });
      }
      onDone?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
      <div
        className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col overscroll-none shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
        style={dragStyle}
      >
        <div className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" {...bind}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-black">대기근무자 지정</h3>
          <div className="flex items-center gap-2 mt-1">
            {/* 날짜 표시 */}
            {incident?.date && (
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                {formatDateKo(incident.date)}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {isDuty ? "주간·야간 각각 선택해주세요" : "대체할 직원을 선택해주세요"}
            </span>
          </div>
        </div>

        {/* 당번: 주간/야간 슬롯 */}
        {isDuty && (
          <div className="px-5 pt-3 grid grid-cols-2 gap-2">
            {/* 주간 슬롯 */}
            <button
              onClick={() => !dayLocked && setActiveSlot("day")}
              disabled={dayLocked}
              className={`rounded-xl p-3 border-2 text-left transition-all ${
                dayLocked
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : activeSlot === "day"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs font-bold ${dayLocked ? "text-gray-400" : activeSlot === "day" ? "text-blue-500" : "text-gray-400"}`}>
                  주간 {dayLocked && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">등록완료</span>}
                </p>
                {dayUser && !dayLocked && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDayId(null); setDayUser(null); }}
                    className="text-gray-300 hover:text-red-400 text-xs font-bold leading-none">✕</button>
                )}
              </div>
              {dayUser ? (
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={dayUser.rank} size="sm" />
                  <span className="text-xs font-bold text-black truncate">{dayUser.name}</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-orange-400">대기자 미정</p>
              )}
            </button>

            {/* 야간 슬롯 */}
            <button
              onClick={() => !nightLocked && setActiveSlot("night")}
              disabled={nightLocked}
              className={`rounded-xl p-3 border-2 text-left transition-all ${
                nightLocked
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : activeSlot === "night"
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs font-bold ${nightLocked ? "text-gray-400" : activeSlot === "night" ? "text-violet-500" : "text-gray-400"}`}>
                  야간 {nightLocked && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">등록완료</span>}
                </p>
                {nightUser && !nightLocked && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setNightId(null); setNightUser(null); }}
                    className="text-gray-300 hover:text-red-400 text-xs font-bold leading-none">✕</button>
                )}
              </div>
              {nightUser ? (
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={nightUser.rank} size="sm" />
                  <span className="text-xs font-bold text-black truncate">{nightUser.name}</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-orange-400">대기자 미정</p>
              )}
            </button>
          </div>
        )}

        {/* 직원 목록 (본인만) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-2">
          <div className="flex flex-col gap-1.5">
            {filtered.map((u) => {
              const selected = isDuty ? isSelectedDuty(u) : selectedId === u._id;
              const isDay = isDuty && dayId === u._id;
              const isNight = isDuty && nightId === u._id;
              return (
                <button
                  key={u._id}
                  onClick={() => {
                    if (isDuty) handleSelectDuty(u);
                    else setSelectedId(selectedId === u._id ? null : u._id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selected
                      ? isDuty
                        ? activeSlot === "day"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-violet-50 border border-violet-200"
                        : "bg-green-50 border border-green-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <RankBadge rank={u.rank} size="sm" />
                  <div className="flex-1 text-left">
                    <span className="font-medium text-black text-sm">{u.name}</span>
                    <span className="text-xs text-gray-500 ml-1.5">{u.team}팀 · {u.rank}</span>
                  </div>
                  {isDuty && isDay && activeSlot === "night" && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">주간</span>
                  )}
                  {isDuty && isNight && activeSlot === "day" && (
                    <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">야간</span>
                  )}
                  {selected && (
                    <Check size={16} className={
                      isDuty
                        ? activeSlot === "day" ? "text-blue-600" : "text-violet-600"
                        : "text-green-600"
                    } />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-700">취소</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="flex-1 py-3.5 bg-blue-600 rounded-xl font-semibold text-white disabled:opacity-50"
          >
            {loading ? "저장 중..." : "지정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
