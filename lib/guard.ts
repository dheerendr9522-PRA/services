import { redirect } from "next/navigation";
import { getStaffSession, type StaffSession } from "@/lib/auth";

export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireOwner(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "owner") redirect("/admin");
  return session;
}
