import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// PWA 서비스 워커 등록 (표준 방식 복원)
registerSW({ immediate: true })

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  createRoot(document.getElementById('root')).render(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#666' }}>
      환경설정 오류: VITE_CONVEX_URL이 없습니다
    </div>
  );
} else {
  const convex = new ConvexReactClient(convexUrl);
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  )
}
