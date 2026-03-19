import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 월별 incidents 조회
export const listByMonth = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
      .collect();

    return await Promise.all(
      incidents.map(async (inc) => {
        const user = await ctx.db.get(inc.userId);
        const subRows = await ctx.db
          .query("substitutes")
          .withIndex("by_incident", (q) => q.eq("incidentId", inc._id))
          .collect();
        const substitutes = await Promise.all(
          subRows.map(async (s) => {
            const subUser = await ctx.db.get(s.substituteUserId);
            return { ...s, user: subUser };
          })
        );
        // registeredBy 필드가 없을 경우 userId로 대기 (기존 데이터 호환)
        const registeredBy = inc.registeredBy || inc.userId;
        return { ...inc, user, substitutes, registeredBy };
      })
    );
  },
});

// 특정 유저의 사고 기록
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return await Promise.all(
      incidents.map(async (inc) => {
        const user = await ctx.db.get(inc.userId);
        const subRows = await ctx.db
          .query("substitutes")
          .withIndex("by_incident", (q) => q.eq("incidentId", inc._id))
          .collect();
        const substitutes = await Promise.all(
          subRows.map(async (s) => {
            const subUser = await ctx.db.get(s.substituteUserId);
            return { ...s, user: subUser };
          })
        );
        // registeredBy 필드가 없을 경우 userId로 대기 (기존 데이터 호환)
        const registeredBy = inc.registeredBy || inc.userId;
        return { ...inc, user, substitutes, registeredBy };
      })
    );
  },
});

// 내가 대기한 기록
export const listSubstitutesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const subs = await ctx.db
      .query("substitutes")
      .withIndex("by_substituteUser", (q) => q.eq("substituteUserId", userId))
      .order("desc")
      .collect();

    return await Promise.all(
      subs.map(async (s) => {
        const incident = await ctx.db.get(s.incidentId);
        const incidentUser = incident ? await ctx.db.get(incident.userId) : null;
        return {
          ...s,
          date: incident?.date,
          shift: incident?.shift,
          reason: incident?.reason,
          startTime: incident?.startTime,
          endTime: incident?.endTime,
          incidentUser,
        };
      })
    );
  },
});

// 연간 통계
export const listByYear = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
      .collect();

    return await Promise.all(
      incidents.map(async (inc) => {
        const user = await ctx.db.get(inc.userId);
        return { ...inc, user };
      })
    );
  },
});

// 사고 등록
// 당번일 때: substituteUserId(주간) + substituteUserIdNight(야간) 각각 저장
export const create = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    shift: v.string(),
    reason: v.string(),
    duty: v.optional(v.string()),
    note: v.optional(v.string()),
    registeredBy: v.optional(v.id("users")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    substituteUserId: v.optional(v.id("users")),       // 주간 or 일반
    substituteUserIdNight: v.optional(v.id("users")),  // 야간 (당번 전용)
  },
  handler: async (ctx, args) => {
    const { substituteUserId, substituteUserIdNight, ...incidentData } = args;

    // 1. incident 저장
    const incidentId = await ctx.db.insert("incidents", incidentData);

    // 2. 대기자 저장
    if (args.shift === "당번") {
      // 당번: 주간/야간 각각 subShift 태그와 함께 저장
      if (substituteUserId) {
        await ctx.db.insert("substitutes", {
          incidentId,
          substituteUserId,
          subShift: "주간",
        });
      }
      if (substituteUserIdNight) {
        await ctx.db.insert("substitutes", {
          incidentId,
          substituteUserId: substituteUserIdNight,
          subShift: "야간",
        });
      }
    } else {
      // 주간/야간: 단일 대기자
      if (substituteUserId) {
        await ctx.db.insert("substitutes", { incidentId, substituteUserId });
      }
    }

    // 3. 알림 발송
    const incidentUser = await ctx.db.get(args.userId);
    let subText = "";
    if (args.shift === "당번") {
      const dayUser = substituteUserId ? await ctx.db.get(substituteUserId) : null;
      const nightUser = substituteUserIdNight ? await ctx.db.get(substituteUserIdNight) : null;
      if (dayUser || nightUser) {
        const parts = [];
        if (dayUser) parts.push(`주간: ${dayUser.name}`);
        if (nightUser) parts.push(`야간: ${nightUser.name}`);
        subText = ` → 대기(${parts.join(", ")})`;
      }
    } else {
      const subUser = substituteUserId ? await ctx.db.get(substituteUserId) : null;
      if (subUser) subText = ` → 대기: ${subUser.name}`;
    }

    const dutyText = args.duty ? ` [${args.duty}]` : "";
    
    // 지각/조퇴 시 시간 정보 포맷팅 (09~11 형식)
    let timeText = "";
    if ((args.reason === "지각" || args.reason === "조퇴") && args.startTime && args.endTime) {
      const startH = args.startTime.split(":")[0];
      const endH = args.endTime.split(":")[0];
      timeText = `(${startH}~${endH})`;
    }

    const message = `[${args.date}] ${incidentUser?.name} ${args.reason}${timeText}(${args.shift || "지각/조퇴"})${dutyText}${subText}`;
    const allUsers = await ctx.db.query("users").collect();
    await Promise.all(
      allUsers.map((u) =>
        ctx.db.insert("notifications", { userId: u._id, message, isRead: false })
      )
    );

    return incidentId;
  },
});

// 사고 삭제
export const remove = mutation({
  args: { id: v.id("incidents") },
  handler: async (ctx, { id }) => {
    const subs = await ctx.db
      .query("substitutes")
      .withIndex("by_incident", (q) => q.eq("incidentId", id))
      .collect();
    await Promise.all(subs.map((s) => ctx.db.delete(s._id)));
    await ctx.db.delete(id);
  },
});
