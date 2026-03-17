import { useState } from "react";
import { Users, Settings, BarChart2, Trash2, Shield, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import RankBadge from "../components/RankBadge";
import BottomNav from "../components/BottomNav";
import NotificationBell from "../components/NotificationBell";
import { ABSENCE_REASONS, toDateString } from "../utils/constants";

export default function Admin() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("users");
  const [cycleForm, setCycleForm] = useState({ baseDate: toDateString(new Date()), baseTeam: "1" });
  const [savingCycle, setSavingCycle] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const allUsers = useQuery(api.users.listUsers) ?? [];
  const cycleBase = useQuery(api.dutyCycle.get);
  const yearStats = useQuery(api.incidents.listByYear, { year: new Date().getFullYear() }) ?? [];

  const toggleAdminMutation = useMutation(api.users.toggleAdmin);
  const deleteUserMutation = useMutation(api.users.deleteUser);
  const saveCycleMutation = useMutation(api.dutyCycle.save);

  // cycleBase가 로드되면 폼 초기화
  const [cycleInitialized, setCycleInitialized] = useState(false);
  if (cycleBase && !cycleInitialized) {
    setCycleForm({ baseDate: cycleBase.baseDate, baseTeam: String(cycleBase.baseTeam) });
    setCycleInitialized(true);
  }

  // 연간 통계 계산
  const stats = (() => {
    const map = {};
    yearStats.forEach((inc) => {
      const uid = inc.userId;
      if (!map[uid]) map[uid] = { user: inc.user, count: 0, reasons: {} };
      map[uid].count++;
      map[uid].reasons[inc.reason] = (map[uid].reasons[inc.reason] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  })();

  const allReasonCounts = (() => {
    const counts = {};
    yearStats.forEach((inc) => {
      counts[inc.reason] = (counts[inc.reason] || 0) + 1;
    });
    return counts;
  })();
  const totalReasons = Object.values(allReasonCounts).reduce((a, b) => a + b, 0);

  const saveCycle = async () => {
    setSavingCycle(true);
    try {
      await saveCycleMutation({ baseDate: cycleForm.baseDate, baseTeam: parseInt(cycleForm.baseTeam) });
      setCycleInitialized(false); // 다음 로드 시 다시 초기화
      alert("당번 기준일이 저장되었습니다.");
    } finally {
      setSavingCycle(false);
    }
  };

  const handleToggleAdmin = async (user) => {
    await toggleAdminMutation({ id: user._id, isAdmin: !user.isAdmin });
  };

  const handleDeleteUser = async (id) => {
    await deleteUserMutation({ id });
    setDeleteUserId(null);
  };

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 pb-24">
        <p className="text-4xl">🔒</p>
        <p className="text-gray-700 font-medium">관리자 권한이 필요합니다</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-7 pb-5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-black">관리자</h1>
          <NotificationBell />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "users", icon: Users, label: "직원" },
            { key: "cycle", icon: Settings, label: "당번 설정" },
            { key: "stats", icon: BarChart2, label: "통계" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                tab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* ───── 직원 탭 ───── */}
        {tab === "users" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-600 font-medium">총 {allUsers.length}명</p>
            {[1, 2, 3].map((team) => {
              const teamUsers = allUsers
                .filter((u) => u.team === team)
                .sort((a, b) => a.name.localeCompare(b.name));
              if (!teamUsers.length) return null;
              const teamStyle = {
                1: { header: "bg-blue-50", title: "text-blue-700" },
                2: { header: "bg-emerald-50", title: "text-emerald-700" },
                3: { header: "bg-violet-50", title: "text-violet-700" },
              }[team];
              return (
                <div key={team} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className={`px-4 py-2.5 ${teamStyle.header}`}>
                    <p className={`text-sm font-bold ${teamStyle.title}`}>
                      {team}팀 ({teamUsers.length}명)
                    </p>
                  </div>
                  {teamUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <RankBadge rank={u.rank} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-black text-sm">{u.name}</span>
                          {u.isAdmin && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">관리자</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{u.rank}</p>
                      </div>
                      <button
                        onClick={() => handleToggleAdmin(u)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isAdmin ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:bg-gray-50"
                        }`}
                        title="관리자 토글"
                      >
                        <Shield size={15} />
                      </button>
                      {u._id !== profile._id && (
                        <button
                          onClick={() => setDeleteUserId(u._id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ───── 당번 설정 탭 ───── */}
        {tab === "cycle" && (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs font-medium text-blue-600 mb-1">당번 사이클 안내</p>
              <p className="text-sm text-blue-800">
                기준일에 어느 팀이 당번인지 설정하면<br />이후 날짜는 자동으로 계산됩니다.
              </p>
              <p className="text-xs text-blue-500 mt-1">사이클: 당번 → 비번 → 비번 (3일)</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-black mb-4">기준일 설정</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-800 mb-1.5 block">기준 날짜</label>
                  <input
                    type="date"
                    value={cycleForm.baseDate}
                    onChange={(e) => setCycleForm((f) => ({ ...f, baseDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800 mb-1.5 block">해당 날짜의 당번 팀</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setCycleForm((f) => ({ ...f, baseTeam: t }))}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          cycleForm.baseTeam === t
                            ? "bg-blue-600 text-white"
                            : "bg-gray-50 text-gray-800 border border-gray-100"
                        }`}
                      >
                        {t}팀
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={saveCycle}
                  disabled={savingCycle}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold mt-1 disabled:opacity-60"
                >
                  {savingCycle ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── 통계 탭 ───── */}
        {tab === "stats" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-gray-900">{new Date().getFullYear()}년 사고 통계</p>

            {/* 사유별 현황 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-black mb-3 text-sm">사유별 현황</h3>
              {ABSENCE_REASONS.map((r) => {
                const count = allReasonCounts[r] || 0;
                const pct = totalReasons ? Math.round((count / totalReasons) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-sm text-gray-800 w-8">{r}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-black w-6 text-right">{count}</span>
                  </div>
                );
              })}
              {totalReasons === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">데이터 없음</p>
              )}
            </div>

            {/* 인원별 랭킹 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-black mb-3 text-sm">인원별 현황 (올해)</h3>
              {stats.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">데이터 없음</p>
              ) : (
                stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className={`text-xs font-bold w-5 text-center ${i < 3 ? "text-blue-500" : "text-gray-500"}`}>
                      {i + 1}
                    </span>
                    <RankBadge rank={s.user?.rank} size="sm" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-black">{s.user?.name}</span>
                      <span className="text-xs text-gray-600 ml-1">{s.user?.team}팀</span>
                    </div>
                    <span className="text-sm font-bold text-black">{s.count}회</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 직원 삭제 확인 모달 */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteUserId(null)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6">
            <h3 className="font-bold text-lg text-black mb-2">직원을 삭제하시겠습니까?</h3>
            <p className="text-gray-700 text-sm mb-5">삭제 후 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteUserId(null)}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-800"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserId)}
                className="flex-1 py-3.5 bg-red-500 rounded-xl font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
