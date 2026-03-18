import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Flame, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMsg = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) {
      setError("이름과 4자리 PIN을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(name.trim(), pin);
      navigate("/");
    } catch (err) {
      setError("이름 또는 PIN 번호가 틀렸습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12 pb-8">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Flame size={32} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold">삼정119안전센터</h1>
        <p className="text-blue-200 text-sm mt-1">대체근무 관리 시스템</p>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-12">
        <h2 className="text-xl font-bold text-black mb-6">로그인</h2>

        {successMsg && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-800 mb-1.5 block">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800 mb-1.5 block">PIN 번호 (4자리)</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base pr-12"
                inputMode="numeric"
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base mt-2 active:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <button onClick={() => navigate("/register")} className="w-full text-center text-sm text-gray-700 mt-4 py-2">
          계정이 없으신가요?{" "}
          <span className="text-blue-600 font-semibold">회원가입</span>
        </button>
      </div>
    </div>
  );
}
