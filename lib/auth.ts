import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type StaffRole = "owner" | "manager" | "operator";

export type StaffSession = {
  id: number;
  username: string;
  name: string;
  role: StaffRole;
};

export type CustomerSession = {
  mobile: string;
  name: string;
};

const SECRET = process.env.AUTH_SECRET || "dheerendra-prajapati-digital-seva-kendra-secret-2026";
const STAFF_COOKIE = "dp_staff";
const CUSTOMER_COOKIE = "dp_customer";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function encode(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const store = await cookies();
  return decode<StaffSession>(store.get(STAFF_COOKIE)?.value);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  return decode<CustomerSession>(store.get(CUSTOMER_COOKIE)?.value);
}

export async function setStaffSession(session: StaffSession): Promise<void> {
  const store = await cookies();
  store.set(STAFF_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function setCustomerSession(session: CustomerSession): Promise<void> {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessions(): Promise<void> {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
  store.delete(CUSTOMER_COOKIE);
}

export function canDelete(role: StaffRole | undefined): boolean {
  return role === "owner";
}

export function canManage(role: StaffRole | undefined): boolean {
  return role === "owner" || role === "manager";
}
