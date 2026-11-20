import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applications,
  banners,
  bills,
  businessProfiles,
  categories,
  customers,
  expenses,
  feedback,
  files,
  invoices,
  offers,
  payments,
  products,
  purchases,
  repairs,
  sales,
  services,
} from "@/db/schema";
import type { SheetTabKey } from "@/lib/googleSheet";

const fmt = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
};

export async function buildSheetRows(tab: SheetTabKey): Promise<(string | number | null)[][]> {
  if (tab === "customers") {
    const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
    return [
      ["ID", "नाम", "मोबाइल", "गाँव", "पता", "ईमेल", "स्थिति", "जुड़ने की तारीख"],
      ...rows.map((c) => [c.id, c.name, c.mobile, c.village, c.address, c.email, c.active ? "ON" : "OFF", fmt(c.createdAt)]),
    ];
  }

  if (tab === "applications") {
    const rows = await db.select().from(applications).orderBy(desc(applications.createdAt));
    return [
      ["Ref", "ग्राहक", "मोबाइल", "व्हाट्सएप", "सेवा", "राशि", "भुगतान", "UTR", "स्थिति", "एडमिन नोट", "दिनांक"],
      ...rows.map((a) => [
        a.refNo,
        a.customerName,
        a.mobile,
        a.whatsapp,
        a.serviceName,
        a.amount,
        a.paymentMode,
        a.utr,
        a.status,
        a.adminNote,
        fmt(a.createdAt),
      ]),
    ];
  }

  if (tab === "repairs") {
    const rows = await db.select().from(repairs).orderBy(desc(repairs.createdAt));
    return [
      ["जॉब", "ग्राहक", "मोबाइल", "डिवाइस", "समस्या", "टेक्नीशियन", "अनुमान", "अंतिम राशि", "स्थिति", "दिनांक"],
      ...rows.map((r) => [
        r.jobNo,
        r.customerName,
        r.mobile,
        r.device,
        r.issue,
        r.technician,
        r.estimate,
        r.finalAmount,
        r.status,
        fmt(r.createdAt),
      ]),
    ];
  }

  if (tab === "invoices") {
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    return [
      ["इनवॉइस", "ग्राहक", "मोबाइल", "आइटम", "छूट", "टैक्स", "कुल", "भुगतान", "स्थिति", "दिनांक"],
      ...rows.map((i) => [
        i.invoiceNo,
        i.customerName,
        i.mobile,
        i.items.map((item) => `${item.label} x${item.qty} @${item.rate}`).join(" | "),
        i.discount,
        i.tax,
        i.total,
        i.paymentMode,
        i.status,
        fmt(i.createdAt),
      ]),
    ];
  }

  if (tab === "expenses") {
    const rows = await db.select().from(expenses).orderBy(desc(expenses.spentAt));
    return [
      ["ID", "शीर्षक", "श्रेणी", "राशि", "भुगतान किसे", "नोट", "खर्च दिनांक"],
      ...rows.map((e) => [e.id, e.title, e.category, e.amount, e.paidTo, e.note, fmt(e.spentAt)]),
    ];
  }

  if (tab === "documents") {
    const rows = await db
      .select({
        id: applicationDocuments.id,
        docType: applicationDocuments.docType,
        fileName: files.name,
        fileSize: files.size,
        fileId: files.id,
        refNo: applications.refNo,
        customer: applications.customerName,
        createdAt: applicationDocuments.createdAt,
      })
      .from(applicationDocuments)
      .innerJoin(files, eq(files.id, applicationDocuments.fileId))
      .innerJoin(applications, eq(applications.id, applicationDocuments.applicationId))
      .orderBy(desc(applicationDocuments.createdAt));
    return [
      ["ID", "Ref", "ग्राहक", "दस्तावेज़ प्रकार", "फाइल", "साइज (KB)", "दिनांक"],
      ...rows.map((d) => [d.id, d.refNo, d.customer, d.docType, d.fileName, Math.round(d.fileSize / 1024), fmt(d.createdAt)]),
    ];
  }

  if (tab === "deliverables") {
    const rows = await db.select().from(applications).where(eq(applications.status, "Completed")).orderBy(desc(applications.updatedAt));
    return [
      ["Ref", "ग्राहक", "मोबाइल", "सेवा", "राशि", "तैयार फाइल", "पूर्ण दिनांक"],
      ...rows.map((a) => [a.refNo, a.customerName, a.mobile, a.serviceName, a.amount, a.completedFileName, fmt(a.updatedAt)]),
    ];
  }

  if (tab === "bills") {
    const rows = await db.select().from(bills).orderBy(desc(bills.createdAt));
    return [
      ["बिल", "ग्राहक", "मोबाइल", "आइटम", "सबटोटल", "छूट", "टैक्स", "कुल", "जमा", "बाकी", "भुगतान", "स्थिति", "दिनांक"],
      ...rows.map((b) => [b.billNo, b.customerName, b.mobile, b.items.map((i) => `${i.name} x${i.qty}`).join(" | "), b.subtotal, b.discount, b.tax, b.grandTotal, b.amountPaid, b.balanceDue, b.paymentMode, b.status, fmt(b.billDate)]),
    ];
  }
  if (tab === "payments") {
    const rows = await db.select().from(payments).orderBy(desc(payments.paidAt));
    return [["बिल", "ग्राहक", "राशि", "माध्यम", "Reference", "दिनांक"], ...rows.map((p) => [p.billNo, p.customerName, p.amount, p.paymentMode, p.reference, fmt(p.paidAt)])];
  }
  if (tab === "salesList") {
    const rows = await db.select().from(sales).orderBy(desc(sales.soldAt));
    return [["बिल", "ग्राहक", "सामान", "मात्रा", "राशि", "भुगतान", "स्थिति", "दिनांक"], ...rows.map((r) => [r.billNo, r.customerName, r.itemName, r.qty, r.amount, r.paymentMode, r.status, fmt(r.soldAt)])];
  }
  if (tab === "purchasesList") {
    const rows = await db.select().from(purchases).orderBy(desc(purchases.purchasedAt));
    return [["सप्लायर", "बिल", "सामान", "मात्रा", "राशि", "दिनांक"], ...rows.map((r) => [r.supplier, r.billNo, r.itemName, r.qty, r.amount, fmt(r.purchasedAt)])];
  }
  if (tab === "stock") {
    const rows = await db.select().from(products).orderBy(desc(products.createdAt));
    return [["उत्पाद", "कोड", "श्रेणी", "खरीद", "बिक्री", "स्टॉक", "न्यूनतम", "स्थिति"], ...rows.map((p) => [p.name, p.code, p.category, p.buyPrice, p.sellPrice, p.stock, p.minStock, p.active ? "ON" : "OFF"])];
  }
  if (tab === "offersList") {
    const rows = await db.select().from(offers).orderBy(desc(offers.createdAt));
    return [["ऑफर", "छूट", "शुरू", "समाप्ति", "स्थिति"], ...rows.map((o) => [o.title, o.discount, fmt(o.startDate), fmt(o.endDate), o.active ? "Active" : "Inactive"])];
  }
  if (tab === "feedbackList") {
    const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
    return [["ग्राहक", "मोबाइल", "रेटिंग", "राय", "जवाब", "सेवा", "दिनांक"], ...rows.map((f) => [f.name, f.mobile, f.rating, f.comment, f.reply, f.serviceName, fmt(f.createdAt)])];
  }
  if (tab === "profilesList") {
    const rows = await db.select().from(businessProfiles).orderBy(desc(businessProfiles.createdAt));
    return [["नाम", "Slug", "श्रेणी", "मालिक", "फोन", "व्यू", "प्रकाशित"], ...rows.map((p) => [p.name, p.slug, p.category, p.ownerName, p.phone, p.views, p.published ? "Published" : "Draft"])];
  }
  if (tab === "bannersList") {
    const rows = await db.select().from(banners).orderBy(desc(banners.createdAt));
    return [["शीर्षक", "पेज", "स्थान", "स्थिति", "शुरू", "समाप्ति"], ...rows.map((b) => [b.title, b.targetPage, b.position, b.status, fmt(b.startDate), fmt(b.endDate)])];
  }

  const rows = await db
    .select({ service: services, category: categories })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .orderBy(services.sortOrder);
  return [
    ["ID", "सेवा", "Service (EN)", "Slug", "श्रेणी", "दुकान शुल्क", "सरकारी शुल्क", "बुकिंग शुल्क", "समय", "शुल्क स्थिति", "स्थिति"],
    ...rows.map((r) => [
      r.service.id,
      r.service.nameHi,
      r.service.nameEn,
      r.service.slug,
      r.category.nameHi,
      r.service.shopFee,
      r.service.govtFee,
      r.service.bookingFee,
      r.service.timeEstimate,
      r.service.feeStatus,
      r.service.active ? "ON" : "OFF",
    ]),
  ];
}
