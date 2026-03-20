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

// 주간/야간 단일 대기자 추가 (기존 전체 삭제 후 교체)
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
    const message = `[${incident?.date}] ${incidentUser?.name} 대기근무자 지정: ${subUser?.name}`;
    await sendNotification(ctx, incident, message);
  },
});

// 당번 전용 — 주간/야간 각각 저장
export const addSubstituteDuty = mutation({
  args: {
    incidentId: v.id("incidents"),
    dayUserId: v.optional(v.id("users")),   // 주간 대기자
    nightUserId: v.optional(v.id("users")), // 야간 대기자
  },
  handler: async (ctx, { incidentId, dayUserId, nightUserId }) => {
    // 기존 대기자 전부 삭제
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
    const message = `[${incident?.date}] ${incidentUser?.name} 당번 대기근무자 지정${subText}`;
    await sendNotification(ctx, incident, message);
  },
});

// 대기자 단건 삭제
export const removeSubstitute = mutation({
  args: { 
    incidentId: v.id("incidents"), 
    subShift: v.optional(v.string()),
    requesterId: v.id("users") 
  },
  handler: async (ctx, { incidentId, subShift, requesterId }) => {
    const incident = await ctx.db.get(incidentId);
    if (!incident) throw new Error("사고 내역을 찾을 수 없습니다.");

    const requester = await ctx.db.get(requesterId);
    if (!requester) throw new Error("사용자를 찾을 수 없습니다.");

    const subs = await ctx.db
      .query("substitutes")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();

    let target = null;
    if (subShift) {
      target = subs.find((s) => s.subShift === subShift);
    } else {
      // 단일 대기자 (지각/조퇴 등)
      target = subs[0];
    }

    if (!target) return; // 이미 없으면 무시

    // 권한 체크: 관리자, 사고 등록자, 사고 당사자(본인), 또는 대기 당사자(본인)만 취소 가능
    const isAdmin = requester.isAdmin;
    const isSubmitter = incident.registeredBy === requesterId || (!incident.registeredBy && incident.userId === requesterId);
    const isIncidentSubject = incident.userId === requesterId;
    const isSubstituteSubject = target.substituteUserId === requesterId;

    if (!isAdmin && !isSubmitter && !isIncidentSubject && !isSubstituteSubject) {
      throw new Error("취소 권한이 없습니다.");
    }

    if (subShift) {
      await ctx.db.delete(target._id);
    } else {
      await Promise.all(subs.map((s) => ctx.db.delete(s._id)));
    }

    // 알림
    const incidentUser = await ctx.db.get(incident.userId);
    const shiftText = subShift ? `(${subShift})` : "";
    const message = `[${incident?.date}] ${incidentUser?.name} 대기근무자${shiftText} 취소`;
    await sendNotification(ctx, incident, message);
  },
});
