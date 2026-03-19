import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// PIN 해싱 (SHA-256)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "samjeong119salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 로그인: 이름 + PIN 검증
export const login = query({
  args: { name: v.string(), pin: v.string() },
  handler: async (ctx, { name, pin }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (!user) return null;

    const hashed = await hashPin(pin);
    if (user.pin !== hashed) return null;
    return user;
  },
});

// 이름 중복 확인
export const checkNameExists = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    return !!user;
  },
});

// 회원가입
export const register = mutation({
  args: {
    name: v.string(),
    pin: v.string(),
    rank: v.string(),
    team: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) throw new Error("이미 사용 중인 이름입니다.");

    const hashed = await hashPin(args.pin);
    const id = await ctx.db.insert("users", {
      name: args.name,
      pin: hashed,
      rank: args.rank,
      team: args.team,
      isAdmin: false,
    });
    return id;
  },
});

// PIN 변경
export const changePin = mutation({
  args: { id: v.id("users"), oldPin: v.string(), newPin: v.string() },
  handler: async (ctx, { id, oldPin, newPin }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const hashedOld = await hashPin(oldPin);
    if (user.pin !== hashedOld) throw new Error("현재 PIN이 올바르지 않습니다.");
    const hashedNew = await hashPin(newPin);
    await ctx.db.patch(id, { pin: hashedNew });
  },
});

// 관리자용 PIN 초기화
export const resetPin = mutation({
  args: { id: v.id("users"), newPin: v.string() },
  handler: async (ctx, { id, newPin }) => {
    const hashed = await hashPin(newPin);
    await ctx.db.patch(id, { pin: hashed });
  },
});

// 전체 직원 목록
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// 특정 유저 조회
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// 관리자 토글
export const toggleAdmin = mutation({
  args: { id: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, { id, isAdmin }) => {
    await ctx.db.patch(id, { isAdmin });
  },
});

// 직원 삭제
export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
// 팀 내 순서 일괄 저장
export const updateSortOrder = mutation({
  args: { updates: v.array(v.object({ id: v.id("users"), sortOrder: v.number() })) },
  handler: async (ctx, { updates }) => {
    await Promise.all(
      updates.map(({ id, sortOrder }) => ctx.db.patch(id, { sortOrder }))
    );
  },
});
