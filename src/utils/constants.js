// 계급 배지 설정
export const RANK_CONFIG = {
  소방경: { short: "경", color: "#ef4444", bg: "#fef2f2" },
  소방위: { short: "위", color: "#f97316", bg: "#fff7ed" },
  소방장: { short: "장", color: "#eab308", bg: "#fefce8" },
  소방교: { short: "교", color: "#22c55e", bg: "#f0fdf4" },
  소방사: { short: "사", color: "#3b82f6", bg: "#eff6ff" },
};

export const RANKS = ["소방경", "소방위", "소방장", "소방교", "소방사"];
export const TEAMS = [1, 2, 3];
export const SHIFT_TYPES = ["당번", "주간", "야간"];
export const ABSENCE_REASONS = ["연가", "병가", "특휴", "공가", "지각", "조퇴"];

export const DUTY_ROLES = [
  "팀장",
  "1선펌프기관", "1선펌프경방",
  "2선펌프기관", "2선펌프경방",
  "구급기관", "구급경방",
  "물탱크기관",
  "굴절기관",
  "고가기관",
  "화학차기관",
];

/**
 * 당번 사이클 계산: 당번 → 비번 → 비번 (3일 반복)
 * cycleBase: { baseDate: "YYYY-MM-DD", baseTeam: 1|2|3 }
 */
export function getDutyTeam(date, cycleBase) {
  if (!cycleBase?.baseDate) return null;
  const base = new Date(cycleBase.baseDate);
  base.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - base) / (1000 * 60 * 60 * 24));
  const mod = ((diffDays % 3) + 3) % 3;
  const teamIndex = (cycleBase.baseTeam - 1 + mod) % 3;
  return teamIndex + 1;
}

export function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateKo(date) {
  const d = new Date(date);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function toDateString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
