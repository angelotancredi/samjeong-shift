import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Info, Calendar as CalendarIcon, Clock, AlertCircle, Check, MapPin, RefreshCw, Search } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import RankBadge from "../components/RankBadge";
import NotificationBell from "../components/NotificationBell";
import { SHIFT_TYPES, ABSENCE_REASONS, DUTY_ROLES, toDateString, formatDateKo } from "../utils/constants";

export default function IncidentRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const initialDate = location.state?.date ?? toDateString(new Date());

  const [form, setForm] = useState({
    incident_user_id: profile?._id ?? null,
    incident_user: profile ?? null,
    date: initialDate,
    shift: "",
    reason: "",
    duty: "",
    note: "",
    startTime: "",
    endTime: "",
    // 주간/야간 단일
    substitute_user_id: null,
    substitute_user: null,
    // 당번 전용 (주간 / 야간 분리)
    sub_day_id: null,
    sub_day: null,
    sub_night_id: null,
    sub_night: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        incident_user_id: profile?._id,
        incident_user: profile,
      }));
    }
  }, [profile]);

  const allUsers = useQuery(api.users.listUsers) ?? [];
  const createIncident = useMutation(api.incidents.create);

  // profile 로딩 중이면 스피너 표시
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const update = (k, v) => {
    const newForm = { ...form, [k]: v };
    // reason이 "지각" 또는 "조퇴"이면 shift 초기화
    if (k === "reason" && (v === "지각" || v === "조퇴")) {
      newForm.shift = "";
    }
    setForm(newForm);
  };

  const isDuty = form.shift === "당번";

  const filteredSubs = allUsers
    .filter((u) =>
      u._id !== profile?._id &&
      (u.name.includes(searchQuery) || String(u.team).includes(searchQuery) || u.rank.includes(searchQuery))
    )
    .sort((a, b) => a.team - b.team || (a.name || "").localeCompare(b.name || ""));

  const handleSubmit = async () => {
    const isLateLateLeave = form.reason === "지각" || form.reason === "조퇴";
    if (!form.date || !form.reason) {
      alert("날짜와 사유를 모두 입력해주세요.");
      return;
    }
    if (!isLateLateLeave && !form.shift) {
      alert("근무 구분을 선택해주세요.");
      return;
    }
    // 지각/조퇴 시 시간 입력 필수 및 검증
    if (isLateLateLeave) {
      if (!form.startTime || !form.endTime) {
        alert("지각/조퇴는 시간 범위를 입력해주세요.");
        return;
      }
      if (form.startTime >= form.endTime) {
        alert("시작 시간은 종료 시간보다 빨라야 합니다.");
        return;
      }
    }
    setLoading(true);
    try {
      await createIncident({
        userId: profile?._id,
        date: form.date,
        shift: form.shift,
        reason: form.reason,
        duty: form.duty || undefined,
        note: form.note || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        registeredBy: profile?._id,
        // 당번이면 주간/야간 각각, 아니면 단일
        substituteUserId: isDuty
          ? (form.sub_day_id || undefined)
          : (form.substitute_user_id || undefined),
        substituteUserIdNight: isDuty
          ? (form.sub_night_id || undefined)
          : undefined,
      });
      setSuccess(true);
    } catch (err) {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setStep(1);
    setForm({
      incident_user_id: profile?._id,
      incident_user: profile,
      date: initialDate,
      shift: "", reason: "", duty: "", note: "", startTime: "", endTime: "",
      substitute_user_id: null, substitute_user: null,
      sub_day_id: null, sub_day: null,
      sub_night_id: null, sub_night: null,
    });
  };

  // 등록 완료 화면
  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-5">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check size={36} className="text-green-500" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-black">등록 완료!</h2>
          <p className="text-gray-700 text-sm mt-1">모든 직원에게 알림이 전송되었습니다.</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5 w-full flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">날짜</span>
            <span className="text-sm font-semibold text-gray-900">{formatDateKo(form.date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">근무 구분</span>
            <span className="text-sm font-semibold text-gray-900">{form.shift}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">사유</span>
            <span className="text-sm font-bold text-red-500">{form.reason}</span>
          </div>
          {(form.startTime || form.endTime) && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">시간</span>
              <span className="text-sm font-semibold text-gray-900">{form.startTime}~{form.endTime}</span>
            </div>
          )}
          <div className="h-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">사고자</span>
            <span className="text-sm font-bold text-black">{profile?.name}</span>
          </div>
          {isDuty ? (
            <>
              {form.sub_day && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">주간 대체</span>
                  <span className="text-sm font-bold text-blue-600">{form.sub_day.name}</span>
                </div>
              )}
              {form.sub_night && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">야간 대체</span>
                  <span className="text-sm font-bold text-violet-600">{form.sub_night.name}</span>
                </div>
              )}
              {!form.sub_day && !form.sub_night && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">대체자</span>
                  <span className="text-sm font-bold text-orange-400">대체자 미정</span>
                </div>
              )}
            </>
          ) : (
            form.substitute_user && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">대체자</span>
                <span className="text-sm font-bold text-black">{form.substitute_user.name}</span>
              </div>
            )
          )}
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={resetForm} className="flex-1 py-4 border border-gray-200 rounded-xl font-semibold text-gray-800">새로 등록</button>
          <button onClick={() => navigate("/")} className="flex-1 py-4 bg-blue-600 rounded-xl font-semibold text-white">홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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
            <NotificationBell size={18} />
          </div>
        </div>

        {/* 2단: 뒤로가기 및 타이틀 */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step === 1 ? navigate("/") : setStep(1)} className="p-1 -ml-1 rounded-full hover:bg-gray-100">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-black tracking-tight">
            {step === 1 ? "사고자 등록" : "대체근무자 지정"}
          </h1>
        </div>

        {/* 진행 상태 바 */}
        <div className="flex gap-2 px-1">
          <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
          <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-5 pb-44">
        {step === 1 ? (
          <Step1 form={form} update={update} profile={profile} />
        ) : isDuty ? (
          <Step2Duty
            form={form}
            update={update}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredUsers={filteredSubs}
          />
        ) : (
          <Step2Single
            form={form}
            update={update}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredUsers={filteredSubs}
          />
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-10 safe-bottom">
         {step === 1 ? (
           <button
             onClick={() => {
               const isLateLateLeave = form.reason === "지각" || form.reason === "조퇴";
               if (!form.date || !form.reason) {
                 alert("날짜와 사유를 모두 입력해주세요.");
                 return;
               }
               if (!isLateLateLeave && !form.shift) {
                 alert("근무 구분을 선택해주세요.");
                 return;
               }
               // 지각/조퇴도 항상 대체근무자 지정 단계로 이동
               setSearchQuery("");
               setStep(2);
             }}
             className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base"
           >
             다음 → 대체근무자 지정
           </button>
         ) : (
          <div className="flex gap-3">
            {/* 대체자 없이 등록 — 항상 한 번 클릭으로 등록 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 border border-gray-200 rounded-xl font-semibold text-gray-800 text-sm"
            >
              대체자 없이 등록
            </button>
            {/* 등록 완료 — 단일: 1명 선택 필요 / 당번: 1명 이상 선택 시 활성화 */}
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                (isDuty
                  ? !form.sub_day_id && !form.sub_night_id
                  : !form.substitute_user_id)
              }
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold text-base disabled:opacity-50"
            >
              {loading ? "등록 중..." : "등록 완료"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step1: 본인 정보 + 날짜 + 근무구분 + 사유 + 비고
function Step1({ form, update, profile }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs text-blue-500 font-medium mb-2">사고자 (본인)</p>
        <div className="flex items-center gap-3">
          <RankBadge rank={profile?.rank} size="md" />
          <div>
            <p className="font-bold text-black">{profile?.name}</p>
            <p className="text-xs text-gray-700">{profile?.team}팀 · {profile?.rank}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-black mb-3">날짜</h3>
        <div className="relative group">
          {/* 실제 날짜 선택은 투명한 input을 통해 수행 */}
          <input 
            type="date" 
            value={form.date} 
            onChange={(e) => update("date", e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          {/* 화면에 보여지는 예쁜 포맷 */}
          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl flex items-center justify-between border border-transparent group-focus-within:border-blue-500 transition-all">
            <span className="text-sm font-semibold text-gray-900">
              {form.date ? `${form.date} (${["일","월","화","수","목","금","토"][new Date(form.date).getDay()]})` : "날짜 선택 (대체자 미정)"}
            </span>
            <CalendarIcon size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-black mb-3">근무 구분</h3>
        <div className="grid grid-cols-3 gap-2">
          {SHIFT_TYPES.map((s) => {
            const isDisabled = form.reason === "지각" || form.reason === "조퇴";
            return (
              <button key={s} 
                onClick={() => !isDisabled && update("shift", s)}
                disabled={isDisabled}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  isDisabled
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                    : form.shift === s 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-50 text-gray-800 border border-gray-100"
                }`}>
                {s}
              </button>
            );
          })}
        </div>
        {!(form.reason === "지각" || form.reason === "조퇴") && form.shift === "당번" && (
          <p className="text-xs text-blue-500 mt-2 font-medium">
            ℹ️ 당번은 주간·야간 대체근무자를 각각 지정할 수 있어요
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-black mb-3">사고 사유</h3>
        <div className="grid grid-cols-3 gap-2">
          {ABSENCE_REASONS.map((r) => (
            <button key={r} onClick={() => update("reason", r)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${form.reason === r ? "bg-red-500 text-white" : "bg-gray-50 text-gray-800 border border-gray-100"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 지각/조퇴시 시간 입력 */}
      {(form.reason === "지각" || form.reason === "조퇴") && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-black mb-3">시간 범위</h3>
          <div className="flex items-center gap-3">
            {/* 시작 시간 */}
            <div className="flex items-center gap-2 flex-1">
              <select
                value={form.startTime.split(':')[0] || ""}
                onChange={(e) => {
                  const mins = form.startTime.split(':')[1] || "00";
                  update("startTime", `${e.target.value}:${mins}`);
                }}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">시 선택</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, "0")}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 font-semibold">:</span>
              <select
                value={form.startTime.split(':')[1] || ""}
                onChange={(e) => {
                  const hours = form.startTime.split(':')[0] || "00";
                  update("startTime", `${hours}:${e.target.value}`);
                }}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">분 선택</option>
                <option value="00">00</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </select>
            </div>
            <span className="text-gray-400 font-semibold">~</span>
            {/* 종료 시간 */}
            <div className="flex items-center gap-2 flex-1">
              <select
                value={form.endTime.split(':')[0] || ""}
                onChange={(e) => {
                  const mins = form.endTime.split(':')[1] || "00";
                  update("endTime", `${e.target.value}:${mins}`);
                }}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">시 선택</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, "0")}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 font-semibold">:</span>
              <select
                value={form.endTime.split(':')[1] || ""}
                onChange={(e) => {
                  const hours = form.endTime.split(':')[0] || "00";
                  update("endTime", `${hours}:${e.target.value}`);
                }}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">분 선택</option>
                <option value="00">00</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 담당 업무 */}
      <DutySelector value={form.duty} onChange={(v) => update("duty", v)} />

      {/* 비고 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-black mb-3">비고 <span className="text-gray-600 text-xs font-normal">(선택)</span></h3>
        <textarea value={form.note} onChange={(e) => update("note", e.target.value)}
          placeholder="추가 메모를 입력하세요" rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  );
}

// Step2 — 당번: 주간 / 야간 각각 선택
function Step2Duty({ form, update, searchQuery, setSearchQuery, filteredUsers }) {
  const [activeSlot, setActiveSlot] = useState("day"); // "day" | "night"

  const selectUser = (u) => {
    if (activeSlot === "day") {
      if (form.sub_day_id === u._id) {
        update("sub_day_id", null); update("sub_day", null);
      } else {
        update("sub_day_id", u._id); update("sub_day", u);
      }
    } else {
      if (form.sub_night_id === u._id) {
        update("sub_night_id", null); update("sub_night", null);
      } else {
        update("sub_night_id", u._id); update("sub_night", u);
      }
    }
  };

  const isSelected = (u) =>
    (activeSlot === "day" && form.sub_day_id === u._id) ||
    (activeSlot === "night" && form.sub_night_id === u._id);

  return (
    <div className="flex flex-col gap-5">
      {/* 사고자 요약 */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs text-blue-500 font-medium mb-2">사고자 정보</p>
        <div className="flex items-center gap-3">
          <RankBadge rank={form.incident_user?.rank} size="md" />
          <div>
            <p className="font-semibold text-black">{form.incident_user?.name}</p>
            <p className="text-xs text-gray-700">{formatDateKo(form.date)} · {form.reason} · {form.shift}</p>
          </div>
        </div>
      </div>

      {/* 선택 현황 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveSlot("day")}
          className={`rounded-2xl p-4 border-2 transition-all text-left ${
            activeSlot === "day" ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white"
          }`}
        >
          <p className={`text-xs font-bold mb-1.5 ${activeSlot === "day" ? "text-blue-500" : "text-gray-400"}`}>
            🌞 주간 대체
          </p>
          {form.sub_day ? (
            <div className="flex items-center gap-2">
              <RankBadge rank={form.sub_day.rank} size="sm" />
              <span className="text-sm font-bold text-black truncate">{form.sub_day.name}</span>
            </div>
          ) : (
            <p className="text-sm font-bold text-orange-400">대체자 미정</p>
          )}
        </button>
        <button
          onClick={() => setActiveSlot("night")}
          className={`rounded-2xl p-4 border-2 transition-all text-left ${
            activeSlot === "night" ? "border-violet-500 bg-violet-50" : "border-gray-100 bg-white"
          }`}
        >
          <p className={`text-xs font-bold mb-1.5 ${activeSlot === "night" ? "text-violet-500" : "text-gray-400"}`}>
            🌙 야간 대체
          </p>
          {form.sub_night ? (
            <div className="flex items-center gap-2">
              <RankBadge rank={form.sub_night.rank} size="sm" />
              <span className="text-sm font-bold text-black truncate">{form.sub_night.name}</span>
            </div>
          ) : (
            <p className="text-sm font-bold text-orange-400">대체자 미정</p>
          )}
        </button>
      </div>

      {/* 직원 목록 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-black">
            {activeSlot === "day" ? "🌞 주간" : "🌙 야간"} 대체근무자 선택
          </h3>
          <span className="text-xs text-gray-400">(선택 안 하면 대체자 미정)</span>
        </div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 팀, 계급 검색"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
          {filteredUsers.map((u) => {
            const selected = isSelected(u);
            const isDay = form.sub_day_id === u._id;
            const isNight = form.sub_night_id === u._id;
            return (
              <button key={u._id} onClick={() => selectUser(u)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selected
                    ? activeSlot === "day"
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-violet-50 border border-violet-200"
                    : "hover:bg-gray-50"
                }`}>
                <RankBadge rank={u.rank} size="sm" />
                <div className="flex-1 text-left">
                  <span className="font-medium text-black text-sm">{u.name}</span>
                  <span className="text-xs text-gray-600 ml-1.5">{u.team}팀 · {u.rank}</span>
                </div>
                {/* 이미 다른 슬롯에 지정된 경우 뱃지 표시 */}
                {isDay && activeSlot === "night" && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">주간</span>
                )}
                {isNight && activeSlot === "day" && (
                  <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">야간</span>
                )}
                {selected && <Check size={16} className={activeSlot === "day" ? "text-blue-600" : "text-violet-600"} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step2 — 주간/야간: 단일 대체자 선택
function Step2Single({ form, update, searchQuery, setSearchQuery, filteredUsers }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs text-blue-500 font-medium mb-2">사고자 정보</p>
        <div className="flex items-center gap-3">
          <RankBadge rank={form.incident_user?.rank} size="md" />
          <div>
            <p className="font-semibold text-black">{form.incident_user?.name}</p>
            <p className="text-xs text-gray-700">{formatDateKo(form.date)} · {form.reason} · {form.shift}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-black mb-1">대체근무자 선택</h3>
        <p className="text-xs text-orange-400 font-medium mb-3">선택하지 않으면 대체자 미정으로 등록됩니다</p>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 팀, 계급 검색"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
          {filteredUsers.map((u) => (
            <button key={u._id}
              onClick={() => {
                if (form.substitute_user_id === u._id) {
                  update("substitute_user_id", null); update("substitute_user", null);
                } else {
                  update("substitute_user_id", u._id); update("substitute_user", u);
                }
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                form.substitute_user_id === u._id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
              }`}>
              <RankBadge rank={u.rank} size="sm" />
              <div className="flex-1 text-left">
                <span className="font-medium text-black text-sm">{u.name}</span>
                <span className="text-xs text-gray-600 ml-1.5">{u.team}팀 · {u.rank}</span>
              </div>
              {form.substitute_user_id === u._id && <Check size={16} className="text-green-600" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 담당 업무 바텀시트 선택 컴포넌트
function DutySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (role) => {
    onChange(value === role ? "" : role);
    setOpen(false);
  };

  // 업무 카테고리 그룹핑
  const groups = [
    { label: "1선 펌프", items: ["팀장", "1선펌프기관", "1선펌프경방"] },
    { label: "2선 펌프", items: ["2선펌프기관", "2선펌프경방"] },
    { label: "구급", items: ["구급기관", "구급경방"] },
    { label: "특수차량", items: ["물탱크기관", "굴절기관", "고가기관", "화학차기관"] },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-black">담당 업무</h3>
          <span className="text-xs text-gray-400 font-normal">(선택)</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
            value
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-gray-50 border-gray-100 text-gray-400"
          }`}
        >
          <span className={`text-sm font-medium ${value ? "text-blue-700" : "text-gray-400"}`}>
            {value || "담당 업무를 선택하세요"}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M4 6l4 4 4-4" stroke={value ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 바텀시트 */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            {/* 핸들 */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-black">담당 업무 선택</h3>
                {value && (
                  <button
                    onClick={() => { onChange(""); setOpen(false); }}
                    className="text-xs text-gray-400 px-2.5 py-1.5 rounded-full bg-gray-100"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-3">
              {groups.map((group) => (
                <div key={group.label} className="mb-4">
                  {/* 그룹 라벨 */}
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 px-1">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const selected = value === item;
                      return (
                        <button
                          key={item}
                          onClick={() => handleSelect(item)}
                          className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-50 text-gray-800 active:bg-gray-100"
                          }`}
                        >
                          <span className="text-sm font-medium">{item}</span>
                          {selected && (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M4 9l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* 하단 여백 */}
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


