import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 당번 기준일 조회
export const get = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("dutyCycle").collect();
    return rows[0] ?? null;
  },
});

// 저장 (없으면 insert, 있으면 update)
export const save = mutation({
  args: { baseDate: v.string(), baseTeam: v.number() },
  handler: async (ctx, { baseDate, baseTeam }) => {
    const rows = await ctx.db.query("dutyCycle").collect();
    if (rows.length > 0) {
      await ctx.db.patch(rows[0]._id, { baseDate, baseTeam });
    } else {
      await ctx.db.insert("dutyCycle", { baseDate, baseTeam });
    }
  },
});
