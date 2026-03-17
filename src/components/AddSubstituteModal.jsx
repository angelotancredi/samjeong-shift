import { useState } from "react";
import { Search, Check } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import RankBadge from "./RankBadge";

// incident: { _id, shift, userId }
// users: 전체 직원 목록
export default function AddSubstituteModal({ incident, users, onClose, onDone }) {
  const isDuty = incident?.shift === "당번";
  const addSubstitute = useMutation(api.substitutes.addSubstitute);
  const addSubstituteDuty = useMutation(api.substitutes.addSubstituteDuty);

  // 단일 (주간/야간)
  const [selectedId, setSelectedId] = useState(null);

  // 당번 전용
  const [activeSlot, setActiveSlot] = useState("day");
  const [dayId, setDayId] = useState(null);
  const [dayUser, setDayUser] = useState(null);
  const [nightId, setNightId] = useState(null);
  const [nightUser, setNightUser] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = users
    .filter((u) =>
      u._id !== incident?.userId &&
      (u.name.includes(search) || String(u.team).includes(search) || u.rank.includes(search))
    )
    .sort((a, b) => a.team - b.team || a.name.localeCompare(b.name));

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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-black">대체근무자 지정</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDuty ? "주간·야간 각각 선택해주세요" : "대체할 직원을 선택해주세요"}
          </p>
        </div>

        {/* 당번: 주간/야간 슬롯 선택 */}
        {isDuty && (
          <div className="px-5 pt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveSlot("day")}
              className={`rounded-xl p-3 border-2 text-left transition-all ${
                activeSlot === "day" ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${activeSlot === "day" ? "text-blue-500" : "text-gray-400"}`}>🌞 주간</p>
              {dayUser ? (
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={dayUser.rank} size="sm" />
                  <span className="text-xs font-bold text-black truncate">{dayUser.name}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">미정</p>
              )}
            </button>
            <button
              onClick={() => setActiveSlot("night")}
              className={`rounded-xl p-3 border-2 text-left transition-all ${
                activeSlot === "night" ? "border-violet-500 bg-violet-50" : "border-gray-100 bg-gray-50"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${activeSlot === "night" ? "text-violet-500" : "text-gray-400"}`}>🌙 야간</p>
              {nightUser ? (
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={nightUser.rank} size="sm" />
                  <span className="text-xs font-bold text-black truncate">{nightUser.name}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">미정</p>
              )}
            </button>
          </div>
        )}

        {/* 검색 */}
        <div className="px-5 pt-3 pb-1">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 팀, 계급 검색"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 직원 목록 */}
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
                  {/* 이미 다른 슬롯에 지정된 경우 뱃지 */}
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
