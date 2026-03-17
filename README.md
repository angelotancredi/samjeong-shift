# 삼정119안전센터 대체근무 관리 시스템

React + Convex + Vercel 기반 모바일 웹앱

---

## 배포 순서

### 1. 의존성 설치

```bash
npm install
```

### 2. Convex 프로젝트 초기화

```bash
npx convex dev
```

- 처음 실행 시 브라우저에서 Convex 로그인/프로젝트 생성 진행
- 완료되면 `.env.local` 파일이 자동 생성되고 `VITE_CONVEX_URL`이 기입됨
- 터미널을 열어두면 스키마/함수가 실시간으로 Convex 클라우드에 반영됨

### 3. 로컬 실행 테스트

```bash
# 터미널 1: Convex 백엔드 동기화 (계속 실행)
npx convex dev

# 터미널 2: Vite 프론트엔드 실행
npm run dev
```

### 4. Vercel 배포

**방법 A — Vercel CLI (권장)**
```bash
npm install -g vercel
npx convex deploy          # Convex 프로덕션 배포 (URL 출력됨)
vercel --prod              # Vercel 배포
```
Vercel 배포 시 `VITE_CONVEX_URL` 환경변수 입력창이 뜨면 `npx convex deploy` 출력값 붙여넣기

**방법 B — GitHub 연동**
1. GitHub 레포 생성 후 push
2. [vercel.com](https://vercel.com) → New Project → 레포 선택
3. Environment Variables에 `VITE_CONVEX_URL` 추가
   - 값: `npx convex deploy` 실행 후 나오는 프로덕션 URL
4. Deploy

### 5. 첫 관리자 계정 설정

1. 앱에서 회원가입
2. [Convex 대시보드](https://dashboard.convex.dev) → 프로젝트 선택
3. **Data** 탭 → `users` 테이블 → 해당 유저 클릭
4. `isAdmin` 필드를 `true`로 수정

---

## 기능 요약

| 기능 | 설명 |
|------|------|
| 로그인/회원가입 | 이름 + 4자리 PIN |
| 홈 (달력) | 월별 달력, 당번팀 표시, 사고자 도트 |
| 사고자 등록 | 2단계: 사고자 → 대체근무자 |
| 전체 현황 | 월별 리스트, 사유/팀 필터 |
| 내 기록 | 내 사고/대체 이력, 통계 |
| 관리자 | 직원관리, 당번기준일 설정, 연간통계 |
| 실시간 알림 | 등록 시 전직원 즉시 알림 (Convex 실시간) |

## 계급별 배지 색상

| 계급 | 배지 | 컬러 |
|------|------|------|
| 소방경 | 경 | 🔴 빨강 |
| 소방위 | 위 | 🟠 주황 |
| 소방장 | 장 | 🟡 노랑 |
| 소방교 | 교 | 🟢 초록 |
| 소방사 | 사 | 🔵 파랑 |

## 기술 스택

- **Frontend**: React + Vite + Tailwind CSS
- **Backend/DB**: Convex (실시간 동기화, 서버리스)
- **배포**: Vercel
- **폰트**: Pretendard
