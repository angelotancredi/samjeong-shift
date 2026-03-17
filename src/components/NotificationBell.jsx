import { useState } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  return `${day}일 전`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-blue-50 transition-colors"
      >
        <Bell size={22} className="text-gray-900" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative mt-auto bg-white rounded-t-[32px] h-[60vh] flex flex-col animate-slide-up shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-black">알림</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2 py-1 rounded-full bg-blue-50"
                  >
                    <CheckCheck size={12} />
                    전체 읽음
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X size={20} className="text-gray-700" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Bell size={36} className="text-gray-200" />
                  <p className="text-gray-600 text-sm">알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markRead(n._id)}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors ${
                      !n.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                    <div className={!n.isRead ? "" : "pl-5"}>
                      <p className="text-sm text-black">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatTimeAgo(n._creationTime)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
