import { useState, useRef, useEffect } from "react";
import { Users, Settings, BarChart2, Trash2, Shield, RefreshCw, GripVertical } from "lucide-react";
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
  const updateSortOrderMutation = useMutation(api.users.updateSortOrder);

  const [cycleInitialized, setCycleInitialized] = useState(false);
  if (cycleBase && !cycleInitialized) {
    setCycleForm({ baseDate: cycleBase.baseDate, baseTeam: String(cycleBase.baseTeam) });
    setCycleInitialized(true);
  }

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
      setCycleInitialized(false);
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


  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 shadow-sm">
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
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-black tracking-tight">관리 설정</h1>
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "users", icon: Users, label: "직원" },
            { key: "cycle", icon: Settings, label: "당번 설정" },
            { key: "stats", icon: BarChart2, label: "통계" },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                tab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* 직원 탭 */}
        {tab === "users" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 font-medium">총 {allUsers.length}명</p>
              {profile?.isAdmin && <p className="text-xs text-gray-400">☰ 길게 눌러 순서 변경</p>}
            </div>
            {[1, 2, 3].map((team) => {
              const teamUsers = allUsers
                .filter((u) => u.team === team)
                .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || (a.name || "").localeCompare(b.name || ""));
              if (!teamUsers.length) return null;
              const teamStyle = {
                1: { header: "bg-blue-50", title: "text-blue-700" },
                2: { header: "bg-emerald-50", title: "text-emerald-700" },
                3: { header: "bg-violet-50", title: "text-violet-700" },
              }[team];
              return (
                <DraggableTeamList
                  key={team}
                  team={team}
                  teamUsers={teamUsers}
                  teamStyle={teamStyle}
                  profile={profile}
                  onToggleAdmin={handleToggleAdmin}
                  onDelete={(id) => setDeleteUserId(id)}
                  onReorder={async (reordered) => {
                    const updates = reordered.map((u, i) => ({ id: u._id, sortOrder: i }));
                    await updateSortOrderMutation({ updates });
                  }}
                />
              );
            })}
          </div>
        )}

        {/* 당번 설정 탭 */}
        {tab === "cycle" && (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs font-medium text-blue-600 mb-1">당번 사이클 안내</p>
              <p className="text-sm text-blue-800">기준일에 어느 팀이 당번인지 설정하면<br />이후 날짜는 자동으로 계산됩니다.</p>
              <p className="text-xs text-blue-500 mt-1">사이클: 당번 → 비번 → 비번 (3일)</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-black">기준일 설정</h3>
                {!profile?.isAdmin && (
                  <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">관리자 전용</span>
                )}
              </div>
              {!profile?.isAdmin && (
                <p className="text-xs text-red-400 font-medium mb-4">⚠️ 설정 변경은 관리자만 가능합니다.</p>
              )}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-800 mb-1.5 block">기준 날짜</label>
                    <input type="date" value={cycleForm.baseDate}
                      disabled={!profile?.isAdmin}
                      onChange={(e) => setCycleForm((f) => ({ ...f, baseDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800 mb-1.5 block">해당 날짜의 당번 팀</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3"].map((t) => (
                      <button key={t} onClick={() => setCycleForm((f) => ({ ...f, baseTeam: t }))}
                        disabled={!profile?.isAdmin}
                        className={`py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                          cycleForm.baseTeam === t ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-800 border border-gray-100"
                        }`}>{t}팀</button>
                    ))}
                  </div>
                </div>
                {profile?.isAdmin && (
                  <button onClick={saveCycle} disabled={savingCycle}
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold mt-1 disabled:opacity-60">
                    {savingCycle ? "저장 중..." : "저장"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 통계 탭 */}
        {tab === "stats" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-gray-900">{new Date().getFullYear()}년 사고 통계</p>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-black mb-3 text-sm">사유별 현황</h3>
              {ABSENCE_REASONS.map((r) => {
                const count = allReasonCounts[r] || 0;
                const pct = totalReasons ? Math.round((count / totalReasons) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-sm text-gray-800 w-8">{r}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-black w-6 text-right">{count}</span>
                  </div>
                );
              })}
              {totalReasons === 0 && <p className="text-gray-600 text-sm text-center py-4">데이터 없음</p>}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-black mb-3 text-sm">인원별 현황 (올해)</h3>
              {stats.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">데이터 없음</p>
              ) : stats.map((s, i) => (
                <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className={`text-xs font-bold w-5 text-center ${i < 3 ? "text-blue-500" : "text-gray-500"}`}>{i + 1}</span>
                  <RankBadge rank={s.user?.rank} size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-black">{s.user?.name}</span>
                    <span className="text-xs text-gray-600 ml-1">{s.user?.team}팀</span>
                  </div>
                  <span className="text-sm font-bold text-black">{s.count}회</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteUserId(null)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6">
            <h3 className="font-bold text-lg text-black mb-2">직원을 삭제하시겠습니까?</h3>
            <p className="text-gray-700 text-sm mb-5">삭제 후 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUserId(null)} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-800">취소</button>
              <button onClick={() => handleDeleteUser(deleteUserId)} className="flex-1 py-3.5 bg-red-500 rounded-xl font-semibold text-white">삭제</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

// 드래그 앤 드롭 팀 목록
function DraggableTeamList({ team, teamUsers, teamStyle, profile, onToggleAdmin, onDelete, onReorder }) {
  const [items, setItems] = useState(teamUsers);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const longPressTimer = useRef(null);
  const [isDragMode, setIsDragMode] = useState(false);

  // teamUsers가 바뀌면 items 동기화
  useEffect(() => { setItems(teamUsers); }, [teamUsers]);

  const handleTouchStart = (id) => {
    longPressTimer.current = setTimeout(() => {
      setIsDragMode(true);
      setDraggingId(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (draggingId && dragOverId && draggingId !== dragOverId) {
      const from = items.findIndex((u) => u._id === draggingId);
      const to = items.findIndex((u) => u._id === dragOverId);
      const newItems = [...items];
      const [moved] = newItems.splice(from, 1);
      newItems.splice(to, 0, moved);
      setItems(newItems);
      onReorder(newItems);
    }
    setDraggingId(null);
    setDragOverId(null);
    setIsDragMode(false);
  };

  // 드래그 (PC)
  const handleDragStart = (id) => setDraggingId(id);
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (id) => {
    if (draggingId === id) return;
    const from = items.findIndex((u) => u._id === draggingId);
    const to = items.findIndex((u) => u._id === id);
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
    onReorder(newItems);
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`px-4 py-2.5 ${teamStyle.header}`}>
        <p className={`text-sm font-bold ${teamStyle.title}`}>{team}팀 ({items.length}명)</p>
      </div>
      {items.map((u) => (
        <div
          key={u._id}
          draggable
          onDragStart={() => handleDragStart(u._id)}
          onDragOver={(e) => handleDragOver(e, u._id)}
          onDrop={() => handleDrop(u._id)}
          onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
          onTouchStart={() => handleTouchStart(u._id)}
          onTouchEnd={handleTouchEnd}
          className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all ${
            draggingId === u._id ? "opacity-40 bg-blue-50" : ""
          } ${dragOverId === u._id && draggingId !== u._id ? "border-t-2 border-blue-400" : ""}`}
        >
          {/* 드래그 핸들 */}
          {profile?.isAdmin && (
            <div className="text-gray-300 cursor-grab active:cursor-grabbing touch-none">
              <GripVertical size={16} />
            </div>
          )}
          <RankBadge rank={u.rank} size="sm" />
          <div className="flex-1 flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{u.name}</span>
            <span className="text-xs text-gray-500 font-medium">{u.rank}</span>
            {u.isAdmin && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold ml-1">관리자</span>}
          </div>
          {profile?.isAdmin && (
            <button onClick={() => onToggleAdmin(u)}
              className={`p-1.5 rounded-lg transition-colors ${u.isAdmin ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}>
              <Shield size={15} />
            </button>
          )}
          {profile?.isAdmin && u._id !== profile._id && (
            <button onClick={() => onDelete(u._id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
