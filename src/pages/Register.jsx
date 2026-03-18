import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RANKS, TEAMS } from "../utils/constants";
import { Flame, ChevronLeft, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const convex = useConvex();
  const registerMutation = useMutation(api.users.register);
  const [form, setForm] = useState({ name: "", pin: "", confirmPin: "", rank: "", team: "" });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("이름을 입력해주세요.");
    if (form.pin.length !== 4) return setError("PIN은 4자리 숫자입니다.");
    if (form.pin !== form.confirmPin) return setError("PIN이 일치하지 않습니다.");
    if (!form.rank) return setError("계급을 선택해주세요.");
    if (!form.team) return setError("팀을 선택해주세요.");

    setLoading(true);
    try {
      const exists = await convex.query(api.users.checkNameExists, { name: form.name.trim() });
      if (exists) return setError("이미 사용 중인 이름입니다.");

      await registerMutation({
        name: form.name.trim(),
        pin: form.pin,
        rank: form.rank,
        team: parseInt(form.team),
      });
      navigate("/login", { state: { message: "가입 완료! 로그인해주세요." } });
    } catch (err) {
      setError("가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={() => navigate("/login")} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-black">회원가입</h1>
      </div>

      <div className="flex-1 px-6 pb-12 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Flame size={24} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-black">삼정119안전센터</p>
            <p className="text-xs text-gray-700">대체근무 관리 시스템</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="실명을 입력하세요"
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">계급</label>
            <div className="grid grid-cols-5 gap-2">
              {RANKS.map((r) => (
                <button type="button" key={r} onClick={() => update("rank", r)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${form.rank === r ? "bg-indigo-600 text-white shadow-md scale-[1.02]" : "bg-gray-50 text-gray-800 border border-gray-100 hover:bg-gray-100"}`}>
                  {r.replace("소방", "")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">팀</label>
            <div className="grid grid-cols-3 gap-3">
              {TEAMS.map((t) => (
                <button type="button" key={t} onClick={() => update("team", String(t))}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${form.team === String(t) ? "bg-orange-500 text-white shadow-md scale-[1.02]" : "bg-gray-50 text-gray-800 border border-gray-100 hover:bg-gray-100"}`}>
                  {t}팀
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">PIN 번호 (4자리)</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={form.pin}
                onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="숫자 4자리" inputMode="numeric"
                className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base pr-12"
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">PIN 확인</label>
            <input
              type="password"
              value={form.confirmPin}
              onChange={(e) => update("confirmPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="PIN 번호 재입력" inputMode="numeric"
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base mt-2 active:bg-blue-700 transition-colors disabled:opacity-60">
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
