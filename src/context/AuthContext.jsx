import { createContext, useContext, useEffect, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const convex = useConvex();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // localStorage에서 userId만 저장/복원
  useEffect(() => {
    const stored = localStorage.getItem("samjeong_userId");
    if (stored) setUserId(stored);
    setLoading(false);
  }, []);

  // userId로 Convex에서 실시간 프로필 구독
  const user = useQuery(
    api.users.getUser,
    userId ? { id: userId } : "skip"
  ) ?? null;

  const login = async (name, pin) => {
    const data = await convex.query(api.users.login, { name, pin });
    if (!data) throw new Error("이름 또는 PIN이 올바르지 않습니다.");
    localStorage.setItem("samjeong_userId", data._id);
    setUserId(data._id);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("samjeong_userId");
    setUserId(null);
  };

  const refreshProfile = async () => {
    // useQuery가 실시간으로 자동 갱신하므로 별도 처리 불필요
  };

  return (
    <AuthContext.Provider value={{ user, profile: user, loading: loading || (!!userId && user === null), login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
