import { createContext, useContext, useEffect, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const convex = useConvex();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  // localStorage에서 userId 복원
  useEffect(() => {
    const stored = localStorage.getItem("samjeong_userId");
    if (stored) setUserId(stored);
    setLoading(false);
  }, []);

  // Convex 연결 타임아웃 — 5초 후에도 user가 없으면 로딩 강제 종료
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [userId]);

  // userId로 Convex에서 실시간 프로필 구독
  const user = useQuery(
    api.users.getUser,
    userId ? { id: userId } : "skip"
  ) ?? null;

  // user 로드되면 타임아웃 리셋
  useEffect(() => {
    if (user) setTimedOut(false);
  }, [user]);

  const login = async (name, pin) => {
    const data = await convex.query(api.users.login, { name, pin });
    if (!data) throw new Error("이름 또는 PIN이 올바르지 않습니다.");
    localStorage.setItem("samjeong_userId", data._id);
    setUserId(data._id);
    setTimedOut(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("samjeong_userId");
    setUserId(null);
    setTimedOut(false);
  };

  const refreshProfile = async () => {};

  // 타임아웃 시 userId 제거 후 로그인 화면으로
  const isLoading = loading || (!!userId && user === null && !timedOut);

  // 타임아웃 됐는데도 user 없으면 로그아웃 처리
  useEffect(() => {
    if (timedOut && !user) {
      localStorage.removeItem("samjeong_userId");
      setUserId(null);
    }
  }, [timedOut, user]);

  return (
    <AuthContext.Provider value={{
      user,
      profile: user,
      loading: isLoading,
      login,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
