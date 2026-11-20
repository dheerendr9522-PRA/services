import { NextResponse } from "next/server";
import { ensureSeeded, getCounts } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  let seed: { seeded: boolean; services: number } | { error: string } = { seeded: false, services: 0 };
  try {
    seed = await ensureSeeded();
  } catch (error) {
    seed = { error: error instanceof Error ? error.message : "seed failed" };
  }
  const counts = await getCounts().catch(() => ({ services: 0, categories: 0, websites: 0 }));
  return NextResponse.json({
    status: "ok",
    app: "Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra",
    time: new Date().toISOString(),
    database: counts,
    seed,
  });
}
