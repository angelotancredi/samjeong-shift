import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotification } from '../hooks/usePushNotification';

export default function PushPermissionBanner() {
  const { permission, requestPermission } = usePushNotification();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('push_banner_dismissed') === 'true'
  );

  // 이미 허용됐거나 닫았으면 표시 안 함
  if (permission === 'granted' || permission === 'denied' || dismissed) return null;

  const handleAllow = async () => {
    await requestPermission();
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-12 pb-3 bg-white shadow-md border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={18} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">알림을 허용해주세요</p>
          <p className="text-xs text-gray-500">사고자 등록 시 즉시 알림을 받을 수 있어요</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAllow}
            className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-full"
          >
            허용
          </button>
          <button onClick={handleDismiss} className="p-1 text-gray-400">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
