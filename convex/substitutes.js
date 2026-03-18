import { v } from "convex/values";
import { mutation } from "./_generated/server";

// 알림 발송 헬퍼
async function sendNotification(ctx, incident, message) {
  const allUsers = await ctx.db.query("users").collect();
  await Promise.all(
    allUsers.map((u) =>
      ctx.db.insert("notifications", { userId: u._id, message, isRead: false })
    )
  );
}

// 주간/야간 단일 대체자 추가 (기존 전체 삭제 후 교체)
export const addSubstitute = mutation({
  args: {
    incidentId: v.id("incidents"),
    substituteUserId: v.id("users"),
  },
  handler: async (ctx, { incidentId, substituteUserId }) => {
    const existing = await ctx.db
      .query("substitutes")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();
    await Promise.all(existing.map((s) => ctx.db.delete(s._id)));
    await ctx.db.insert("substitutes", { incidentId, substituteUserId });

    const incident = await ctx.db.get(incidentId);
    const incidentUser = incident ? await ctx.db.get(incident.userId) : null;
    const subUser = await ctx.db.get(substituteUserId);
    const message = `[${incident?.date}] ${incidentUser?.name} 대체근무자 지정: ${subUser?.name}`;
    await sendNotification(ctx, incident, message);
  },
});

// 당번 전용 — 주간/야간 각각 저장
export const addSubstituteDuty = mutation({
  args: {
    incidentId: v.id("incidents"),
    dayUserId: v.optional(v.id("users")),   // 주간 대체자
    nightUserId: v.optional(v.id("users")), // 야간 대체자
  },
  handler: async (ctx, { incidentId, dayUserId, nightUserId }) => {
    // 기존 대체자 전부 삭제
    const existing = await ctx.db
      .query("substitutes")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();
    await Promise.all(existing.map((s) => ctx.db.delete(s._id)));

    // 주간 저장
    if (dayUserId) {
      await ctx.db.insert("substitutes", {
        incidentId,
        substituteUserId: dayUserId,
        subShift: "주간",
      });
    }
    // 야간 저장
    if (nightUserId) {
      await ctx.db.insert("substitutes", {
        incidentId,
        substituteUserId: nightUserId,
        subShift: "야간",
      });
    }

    // 알림
    const incident = await ctx.db.get(incidentId);
    const incidentUser = incident ? await ctx.db.get(incident.userId) : null;
    const dayUser = dayUserId ? await ctx.db.get(dayUserId) : null;
    const nightUser = nightUserId ? await ctx.db.get(nightUserId) : null;
    const parts = [];
    if (dayUser) parts.push(`주간: ${dayUser.name}`);
    if (nightUser) parts.push(`야간: ${nightUser.name}`);
    const subText = parts.length > 0 ? ` (${parts.join(", ")})` : "";
    const message = `[${incident?.date}] ${incidentUser?.name} 당번 대체근무자 지정${subText}`;
    await sendNotification(ctx, incident, message);
  },
});

// 대체자 단건 삭제
export const removeSubstitute = mutation({
  args: { incidentId: v.id("incidents"), subShift: v.optional(v.string()) },
  handler: async (ctx, { incidentId, subShift }) => {
    const subs = await ctx.db
      .query("substitutes")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();

    if (subShift) {
      // 당번: 특정 슬롯만 삭제
      const target = subs.find((s) => s.subShift === subShift);
      if (target) await ctx.db.delete(target._id);
    } else {
      // 단일: 전체 삭제
      await Promise.all(subs.map((s) => ctx.db.delete(s._id)));
    }

    // 알림
    const incident = await ctx.db.get(incidentId);
    const incidentUser = incident ? await ctx.db.get(incident.userId) : null;
    const shiftText = subShift ? `(${subShift})` : "";
    const message = `[${incident?.date}] ${incidentUser?.name} 대체근무자${shiftText} 취소`;
    await sendNotification(ctx, incident, message);
  },
});
