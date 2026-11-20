import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applications,
  customers,
  expenses,
  files,
  invoices,
  repairs,
  services,
  users,
  websites,
} from "@/db/schema";

export type OverviewStats = {
  customers: number;
  applications: number;
  repairs: number;
  services: number;
  documents: number;
  collected: number;
  outstanding: number;
  expenses: number;
  net: number;
  websitesOn: number;
  websitesOff: number;
  users: number;
  pending: number;
  inProgress: number;
  completed: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
  const [customerRows, applicationRows, repairRows, serviceRows, documentRows, fileRows, invoiceRows, expenseRows, websiteRows, userRows] =
    await Promise.all([
      db.select({ value: count() }).from(customers),
      db.select({ status: applications.status, amount: applications.amount }).from(applications),
      db.select({ status: repairs.status }).from(repairs),
      db.select({ value: count() }).from(services),
      db.select({ value: count() }).from(applicationDocuments),
      db.select({ value: count() }).from(files),
      db.select({ total: invoices.total, status: invoices.status }).from(invoices),
      db.select({ amount: expenses.amount }).from(expenses),
      db.select({ active: websites.active }).from(websites),
      db.select({ value: count() }).from(users),
    ]);

  const collected = invoiceRows.filter((i) => i.status === "Paid").reduce((sum, i) => sum + Number(i.total ?? 0), 0);
  const outstanding = invoiceRows.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + Number(i.total ?? 0), 0);
  const expenseTotal = expenseRows.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  return {
    customers: Number(customerRows[0]?.value ?? 0),
    applications: applicationRows.length,
    repairs: repairRows.length,
    services: Number(serviceRows[0]?.value ?? 0),
    documents: Number(documentRows[0]?.value ?? 0) + Number(fileRows[0]?.value ?? 0),
    collected,
    outstanding,
    expenses: expenseTotal,
    net: collected - expenseTotal,
    websitesOn: websiteRows.filter((w) => w.active).length,
    websitesOff: websiteRows.filter((w) => !w.active).length,
    users: Number(userRows[0]?.value ?? 0),
    pending: applicationRows.filter((a) => a.status === "Pending").length,
    inProgress: applicationRows.filter((a) => a.status === "In Progress").length,
    completed: applicationRows.filter((a) => a.status === "Completed").length,
  };
}

export async function getRecentApplications(limit = 8) {
  return db.select().from(applications).orderBy(desc(applications.createdAt)).limit(limit);
}

export async function getRecentRepairs(limit = 6) {
  return db.select().from(repairs).orderBy(desc(repairs.createdAt)).limit(limit);
}
