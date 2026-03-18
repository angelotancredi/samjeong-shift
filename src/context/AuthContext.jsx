import { createContext, useContext, useEffect, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const convex = useConvex();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("samjeong_userId");
    if (stored) setUserId(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [userId]);

  const user = useQuery(
    api.users.getUser,
    userId ? { id: userId } : "skip"
  ) ?? null;

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

  const isLoading = loading || (!!userId && user === null && !timedOut);

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