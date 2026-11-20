import { and, asc, count, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applications,
  categories,
  customers,
  files,
  invoices,
  repairs,
  services,
  websites,
} from "@/db/schema";
import type { Category, Service, Website } from "@/db/schema";

export type CategoryWithCount = Category & { serviceCount: number };

export async function getCategories(activeOnly = true): Promise<CategoryWithCount[]> {
  const rows = await db
    .select({
      category: categories,
      serviceCount: count(services.id),
    })
    .from(categories)
    .leftJoin(services, and(eq(services.categoryId, categories.id), eq(services.active, true)))
    .where(activeOnly ? eq(categories.active, true) : sql`true`)
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
  return rows.map((r) => ({ ...r.category, serviceCount: Number(r.serviceCount) }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export type ServiceFilters = {
  q?: string;
  categorySlug?: string;
  categoryId?: number;
  minFee?: number;
  maxFee?: number;
  limit?: number;
  activeOnly?: boolean;
  featured?: boolean;
};

export type ServiceWithCategory = Service & {
  categoryNameHi: string;
  categorySlug: string;
  categoryIcon: string;
};

export async function getServices(filters: ServiceFilters = {}): Promise<ServiceWithCategory[]> {
  const conditions: SQL[] = [];
  if (filters.activeOnly !== false) conditions.push(eq(services.active, true));
  if (filters.q) {
    const like = `%${filters.q}%`;
    const clause = or(
      ilike(services.nameHi, like),
      ilike(services.nameEn, like),
      ilike(services.description, like),
    );
    if (clause) conditions.push(clause);
  }
  if (filters.categoryId) conditions.push(eq(services.categoryId, filters.categoryId));
  if (filters.categorySlug) conditions.push(eq(categories.slug, filters.categorySlug));
  if (typeof filters.minFee === "number") conditions.push(gte(services.shopFee, filters.minFee));
  if (typeof filters.maxFee === "number") conditions.push(lte(services.shopFee, filters.maxFee));
  if (filters.featured) conditions.push(eq(services.featured, true));

  const rows = await db
    .select({
      service: services,
      categoryNameHi: categories.nameHi,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .where(conditions.length ? and(...conditions) : sql`true`)
    .orderBy(asc(services.sortOrder), asc(services.nameEn))
    .limit(filters.limit ?? 500);

  return rows.map((r) => ({
    ...r.service,
    categoryNameHi: r.categoryNameHi,
    categorySlug: r.categorySlug,
    categoryIcon: r.categoryIcon,
  }));
}

export async function getServiceBySlug(slug: string): Promise<ServiceWithCategory | null> {
  const rows = await db
    .select({
      service: services,
      categoryNameHi: categories.nameHi,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .where(eq(services.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row.service,
    categoryNameHi: row.categoryNameHi,
    categorySlug: row.categorySlug,
    categoryIcon: row.categoryIcon,
  };
}

export async function getWebsites(activeOnly = true): Promise<Website[]> {
  return db
    .select()
    .from(websites)
    .where(activeOnly ? eq(websites.active, true) : sql`true`)
    .orderBy(asc(websites.sortOrder), asc(websites.name));
}

export async function getApplications(options: { mobile?: string; limit?: number } = {}) {
  const query = db.select().from(applications);
  const rows = options.mobile
    ? await query.where(eq(applications.mobile, options.mobile)).orderBy(desc(applications.createdAt))
    : await query.orderBy(desc(applications.createdAt)).limit(options.limit ?? 200);
  return rows;
}

export async function getApplicationByRef(ref: string, mobile?: string) {
  const conditions = [eq(applications.refNo, ref.trim().toUpperCase())];
  if (mobile) conditions.push(eq(applications.mobile, mobile.trim()));
  const rows = await db
    .select()
    .from(applications)
    .where(and(...conditions))
    .limit(1);
  return rows[0] ?? null;
}

export async function getApplicationDocuments(applicationIds: number[]) {
  if (applicationIds.length === 0) return [];
  const rows = await db
    .select({
      id: applicationDocuments.id,
      applicationId: applicationDocuments.applicationId,
      docType: applicationDocuments.docType,
      fileId: files.id,
      fileName: files.name,
      fileSize: files.size,
      comment: applicationDocuments.comment,
      uploadedBy: applicationDocuments.uploadedBy,
      serviceSlug: applicationDocuments.serviceSlug,
      createdAt: applicationDocuments.createdAt,
    })
    .from(applicationDocuments)
    .innerJoin(files, eq(files.id, applicationDocuments.fileId))
    .where(sql`${applicationDocuments.applicationId} = any(${sql.raw(`array[${applicationIds.join(",")}]`)})`);
  return rows;
}

export async function getCustomers(search?: string) {
  const rows = search
    ? await db
        .select()
        .from(customers)
        .where(or(ilike(customers.name, `%${search}%`), ilike(customers.mobile, `%${search}%`)))
        .orderBy(desc(customers.createdAt))
        .limit(300)
    : await db.select().from(customers).orderBy(desc(customers.createdAt)).limit(300);
  return rows;
}

export async function getInvoices(limit = 300) {
  return db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit);
}

export async function getRepairs(limit = 300) {
  return db.select().from(repairs).orderBy(desc(repairs.createdAt)).limit(limit);
}

export async function getAdminStats() {
  const [serviceCount, categoryCount, websiteCount, applicationRows, invoiceRows, repairRows, customerCount] =
    await Promise.all([
      db.select({ value: count() }).from(services),
      db.select({ value: count() }).from(categories),
      db.select({ value: count() }).from(websites),
      db.select({ status: applications.status }).from(applications),
      db.select({ total: invoices.total, status: invoices.status, createdAt: invoices.createdAt }).from(invoices),
      db.select({ status: repairs.status }).from(repairs),
      db.select({ value: count() }).from(customers),
    ]);

  const revenue = invoiceRows
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + Number(i.total || 0), 0);
  const pendingInvoices = invoiceRows.filter((i) => i.status !== "Paid").length;
  return {
    services: Number(serviceCount[0]?.value ?? 0),
    categories: Number(categoryCount[0]?.value ?? 0),
    websites: Number(websiteCount[0]?.value ?? 0),
    customers: Number(customerCount[0]?.value ?? 0),
    applications: applicationRows.length,
    pendingApps: applicationRows.filter((a) => a.status === "Pending").length,
    progressApps: applicationRows.filter((a) => a.status === "In Progress").length,
    completedApps: applicationRows.filter((a) => a.status === "Completed").length,
    openRepairs: repairRows.filter((r) => r.status !== "Completed").length,
    completedRepairs: repairRows.filter((r) => r.status === "Completed").length,
    revenue,
    invoices: invoiceRows.length,
    pendingInvoices,
  };
}

export async function globalSearch(q: string) {
  const like = `%${q}%`;
  const [serviceRows, websiteRows, categoryRows] = await Promise.all([
    q
      ? db
          .select({ service: services, categorySlug: categories.slug })
          .from(services)
          .innerJoin(categories, eq(categories.id, services.categoryId))
          .where(
            and(
              eq(services.active, true),
              or(ilike(services.nameHi, like), ilike(services.nameEn, like), ilike(services.description, like)) as SQL,
            ),
          )
          .limit(40)
      : Promise.resolve([]),
    q
      ? db
          .select()
          .from(websites)
          .where(and(eq(websites.active, true), or(ilike(websites.name, like), ilike(websites.url, like)) as SQL))
          .limit(20)
      : Promise.resolve([]),
    q
      ? db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.active, true),
              or(ilike(categories.nameHi, like), ilike(categories.nameEn, like)) as SQL,
            ),
          )
          .limit(20)
      : Promise.resolve([]),
  ]);
  return { serviceRows, websiteRows, categoryRows };
}
