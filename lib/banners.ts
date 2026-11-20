import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { banners, type Banner } from "@/db/schema";

export async function getBannersForPage(page: string, position?: string): Promise<Banner[]> {
  try {
    const now = new Date();
    return await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.targetPage, page),
          eq(banners.active, true),
          gte(banners.endDate, now),
          lte(banners.startDate, now),
        ),
      )
      .orderBy(asc(banners.displayOrder));
  } catch {
    return [];
  }
}
