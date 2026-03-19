// 계급 배지 설정
export const RANK_CONFIG = {
  소방경: { short: "경", color: "#eab308", bg: "#fefce8" },
  소방위: { short: "위", color: "#f97316", bg: "#fff7ed" },
  소방장: { short: "장", color: "#ef4444", bg: "#fef2f2" },
  소방교: { short: "교", color: "#22c55e", bg: "#f0fdf4" },
  소방사: { short: "사", color: "#3b82f6", bg: "#eff6ff" },
};

export const RANKS = ["소방경", "소방위", "소방장", "소방교", "소방사"];
export const TEAMS = [1, 2, 3];
export const SHIFT_TYPES = ["당번", "주간", "야간"];
export const ABSENCE_REASONS = ["연가", "병가", "특휴", "공가", "출장", "장기재직", "안식휴가", "지각", "조퇴"];

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
function parseDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  
  if (typeof d === "string") {
    const datePart = d.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, day] = datePart.split("-").map(Number);
      return new Date(y, m - 1, day);
    }
  }
  return new Date(d);
}

export function getDutyTeam(date, cycleBase) {
  if (!cycleBase?.baseDate) return null;
  const base = parseDate(cycleBase.baseDate);
  const target = parseDate(date);
  // 시간을 00:00:00으로 맞춰서 일수 차이 계산
  base.setHours(0, 0, 0, 0);
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
  if (!date) return "";
  const d = parseDate(date);
  if (isNaN(d.getTime())) return String(date);
  
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dow = d.getDay();
  return `${m}월 ${day}일 (${days[dow]})`;
}

export function toDateString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
