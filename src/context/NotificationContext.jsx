import { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./AuthContext";
import { usePushNotification } from "../hooks/usePushNotification";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { showLocalNotification } = usePushNotification();
  const prevCountRef = useRef(null);

  const notifications = useQuery(
    api.notifications.listMine,
    user ? { userId: user._id } : "skip"
  ) ?? [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 새 알림 오면 로컬 푸시 발송
  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevCountRef.current) {
      const newest = notifications.find((n) => !n.isRead);
      if (newest) {
        showLocalNotification('삼정119안전센터', newest.message);
      }
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const markReadMutation = useMutation(api.notifications.markRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  const markRead = (id) => markReadMutation({ id });
  const markAllRead = () => user && markAllReadMutation({ userId: user._id });

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
