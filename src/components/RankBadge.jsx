import { RANK_CONFIG } from "../utils/constants";

export default function RankBadge({ rank, size = "md" }) {
  const config = RANK_CONFIG[rank] || { short: "?", color: "#9ca3af", bg: "#f9fafb" };
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: config.bg, color: config.color, border: `2px solid ${config.color}20` }}
    >
      {config.short}
    </div>
  );
}
