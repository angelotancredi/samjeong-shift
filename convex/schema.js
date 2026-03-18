import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    pin: v.string(),
    rank: v.string(),
    team: v.number(),
    isAdmin: v.boolean(),
  }).index("by_name", ["name"]),

  dutyCycle: defineTable({
    baseDate: v.string(),
    baseTeam: v.number(),
  }),

  incidents: defineTable({
    userId: v.id("users"),
    date: v.string(),
    shift: v.string(),       // 당번 | 주간 | 야간
    reason: v.string(),
    duty: v.optional(v.string()),  // 담당 업무
    note: v.optional(v.string()),
    registeredBy: v.optional(v.id("users")),
    startTime: v.optional(v.string()),  // 시작 시간 "HH:MM" 형식 (지각/조퇴용)
    endTime: v.optional(v.string()),    // 종료 시간 "HH:MM" 형식 (지각/조퇴용)
  })
    .index("by_date", ["date"])
    .index("by_userId", ["userId"]),

  substitutes: defineTable({
    incidentId: v.id("incidents"),
    substituteUserId: v.id("users"),
    subShift: v.optional(v.string()), // 당번일 때 "주간" | "야간" 구분
  })
    .index("by_incident", ["incidentId"])
    .index("by_substituteUser", ["substituteUserId"]),

  notifications: defineTable({
    message: v.string(),
    isRead: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
});
