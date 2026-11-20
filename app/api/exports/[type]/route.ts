import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, auditLogs, banners, bills, bookings, businessProfiles, categories, creditLedger, customers, expenses, feedback, inquiries, integrations, invoices, learnings, offers, payments, products, purchases, repairs, sales, services } from "@/db/schema";
import { toCsv } from "@/lib/utils";

export const dynamic = "force-dynamic";

function csvResponse(csv: string, filename: string) {
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const dateParts = [];
  if (from) dateParts.push(gte(applications.createdAt, new Date(from)));
  if (to) dateParts.push(lte(applications.createdAt, new Date(`${to}T23:59:59`)));
  const createdClause = dateParts.length ? and(...dateParts) : undefined;

  if (type === "all-services") {
    const rows = await db
      .select({ service: services, category: categories })
      .from(services)
      .innerJoin(categories, eq(categories.id, services.categoryId));
    const csv = toCsv(
      ["ID", "सेवा", "Service (EN)", "Slug", "श्रेणी", "दुकान शुल्क", "सरकारी शुल्क", "बुकिंग शुल्क", "समय", "शुल्क स्थिति", "स्थिति"],
      rows.map((r) => [
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
    );
    return csvResponse(csv, "all-services.csv");
  }

  if (type === "customers") {
    const rows = await db.select().from(customers);
    const csv = toCsv(
      ["ID", "नाम", "मोबाइल", "गाँव", "पता", "ईमेल", "जुड़ने की तारीख"],
      rows.map((c) => [c.id, c.name, c.mobile, c.village, c.address, c.email, c.createdAt.toISOString()]),
    );
    return csvResponse(csv, "customers.csv");
  }

  if (type === "applications") {
    const rows = createdClause
      ? await db.select().from(applications).where(createdClause)
      : await db.select().from(applications);
    const csv = toCsv(
      ["Ref", "ग्राहक", "मोबाइल", "सेवा", "राशि", "भुगतान", "UTR", "स्थिति", "दिनांक"],
      rows.map((a) => [
        a.refNo,
        a.customerName,
        a.mobile,
        a.serviceName,
        a.amount,
        a.paymentMode,
        a.utr,
        a.status,
        a.createdAt.toISOString(),
      ]),
    );
    return csvResponse(csv, "applications.csv");
  }

  if (type === "deliverables") {
    const rows = await db.select().from(applications).where(eq(applications.status, "Completed"));
    const csv = toCsv(
      ["Ref", "ग्राहक", "मोबाइल", "सेवा", "राशि", "तैयार फाइल", "पूर्ण दिनांक", "डाउनलोड"],
      rows.map((a) => [
        a.refNo,
        a.customerName,
        a.mobile,
        a.serviceName,
        a.amount,
        a.completedFileName || "—",
        a.updatedAt.toISOString(),
        a.completedFileId ? `https://digital-seva.local/api/files/${a.completedFileId}` : "—",
      ]),
    );
    return csvResponse(csv, "completed-work.csv");
  }

  if (type === "invoices") {
    const rows = await db.select().from(invoices);
    const csv = toCsv(
      ["इनवॉइस", "ग्राहक", "मोबाइल", "कुल", "भुगतान", "स्थिति", "दिनांक"],
      rows.map((i) => [i.invoiceNo, i.customerName, i.mobile, i.total, i.paymentMode, i.status, i.createdAt.toISOString()]),
    );
    return csvResponse(csv, "invoices.csv");
  }

  if (type === "bills") {
    const rows = await db.select().from(bills);
    return csvResponse(toCsv(["बिल", "ग्राहक", "मोबाइल", "आइटम", "सबटोटल", "छूट", "टैक्स", "कुल", "जमा", "बाकी", "भुगतान", "स्थिति", "दिनांक"], rows.map((b) => [b.billNo, b.customerName, b.mobile, b.items.map((i) => `${i.name} x${i.qty}`).join(" | "), b.subtotal, b.discount, b.tax, b.grandTotal, b.amountPaid, b.balanceDue, b.paymentMode, b.status, b.billDate.toISOString()])), "bills.csv");
  }
  if (type === "payments") {
    const rows = await db.select().from(payments);
    return csvResponse(toCsv(["बिल", "ग्राहक", "राशि", "माध्यम", "Reference", "दिनांक"], rows.map((r) => [r.billNo, r.customerName, r.amount, r.paymentMode, r.reference, r.paidAt.toISOString()])), "payments.csv");
  }
  if (type === "offers") {
    const rows = await db.select().from(offers);
    return csvResponse(toCsv(["ऑफर", "छूट", "शुरू", "समाप्ति", "स्थिति"], rows.map((r) => [r.title, r.discount, r.startDate.toISOString(), r.endDate.toISOString(), r.active ? "Active" : "Inactive"])), "offers.csv");
  }
  if (type === "feedback") {
    const rows = await db.select().from(feedback);
    return csvResponse(toCsv(["ग्राहक", "मोबाइल", "रेटिंग", "राय", "जवाब", "सेवा", "दिनांक"], rows.map((r) => [r.name, r.mobile, r.rating, r.comment, r.reply, r.serviceName, r.createdAt.toISOString()])), "feedback.csv");
  }
  if (type === "profiles") {
    const rows = await db.select().from(businessProfiles);
    return csvResponse(toCsv(["नाम", "Slug", "श्रेणी", "मालिक", "फोन", "व्यू", "प्रकाशित"], rows.map((r) => [r.name, r.slug, r.category, r.ownerName, r.phone, r.views, r.published ? "Published" : "Draft"])), "business-profiles.csv");
  }
  if (type === "inquiries") {
    const rows = await db.select().from(inquiries);
    return csvResponse(toCsv(["नाम", "मोबाइल", "प्रोफाइल", "संदेश", "स्थिति", "दिनांक"], rows.map((r) => [r.name, r.mobile, r.profileSlug, r.message, r.status, r.createdAt.toISOString()])), "inquiries.csv");
  }
  if (type === "banners") {
    const rows = await db.select().from(banners);
    return csvResponse(toCsv(["शीर्षक", "पेज", "स्थान", "स्थिति", "शुरू", "समाप्ति", "क्रम"], rows.map((r) => [r.title, r.targetPage, r.position, r.status, r.startDate.toISOString(), r.endDate.toISOString(), r.displayOrder])), "banners.csv");
  }
  if (type === "learnings") {
    const rows = await db.select().from(learnings);
    return csvResponse(toCsv(["सेवा", "पात्रता", "दस्तावेज़", "स्टेप", "वीडियो", "स्थिति"], rows.map((r) => [r.serviceName, r.eligibility, r.documents, r.steps.length, r.videoUrl, r.active ? "ON" : "OFF"])), "learnings.csv");
  }
  if (type === "integrations") {
    const rows = await db.select().from(integrations);
    return csvResponse(toCsv(["नाम", "प्रकार", "URL", "सेवा", "डेटाबेस", "स्थिति"], rows.map((r) => [r.name, r.type, r.url, r.relatedService, r.dbType, r.status])), "integrations.csv");
  }

  if (type === "sales") {
    const rows = await db.select().from(sales);
    return csvResponse(toCsv(["बिल", "ग्राहक", "मोबाइल", "सामान", "मात्रा", "दर", "छूट", "राशि", "भुगतान", "स्थिति", "दिनांक"], rows.map((r) => [r.billNo, r.customerName, r.mobile, r.itemName, r.qty, r.rate, r.discount, r.amount, r.paymentMode, r.status, r.soldAt.toISOString()])), "sales.csv");
  }
  if (type === "purchases") {
    const rows = await db.select().from(purchases);
    return csvResponse(toCsv(["सप्लायर", "बिल", "सामान", "मात्रा", "दर", "राशि", "भुगतान", "दिनांक"], rows.map((r) => [r.supplier, r.billNo, r.itemName, r.qty, r.rate, r.amount, r.paymentMode, r.purchasedAt.toISOString()])), "purchases.csv");
  }
  if (type === "products") {
    const rows = await db.select().from(products);
    return csvResponse(toCsv(["उत्पाद", "कोड", "श्रेणी", "खरीद", "बिक्री", "स्टॉक", "न्यूनतम", "स्थिति"], rows.map((r) => [r.name, r.code, r.category, r.buyPrice, r.sellPrice, r.stock, r.minStock, r.active ? "ON" : "OFF"])), "stock.csv");
  }
  if (type === "credit") {
    const rows = await db.select().from(creditLedger);
    return csvResponse(toCsv(["ग्राहक", "मोबाइल", "कुल", "जमा", "बाकी", "स्थिति", "नोट"], rows.map((r) => [r.customerName, r.mobile, r.totalAmount, r.paidAmount, Math.max(0, r.totalAmount - r.paidAmount), r.status, r.note])), "credit.csv");
  }
  if (type === "bookings") {
    const rows = await db.select().from(bookings);
    return csvResponse(toCsv(["ID", "सेवा", "ग्राहक", "मोबाइल", "शुल्क", "स्थिति", "विवरण"], rows.map((r) => [r.refNo, r.serviceName, r.customerName, r.mobile, r.fee, r.status, r.details])), "bookings.csv");
  }

  if (type === "expenses") {
    const rows = await db.select().from(expenses);
    const csv = toCsv(
      ["ID", "शीर्षक", "श्रेणी", "राशि", "किसे", "नोट", "दिनांक"],
      rows.map((e) => [e.id, e.title, e.category, e.amount, e.paidTo, e.note, e.spentAt.toISOString()]),
    );
    return csvResponse(csv, "expenses.csv");
  }

  if (type === "audit") {
    const rows = await db.select().from(auditLogs);
    const csv = toCsv(
      ["ID", "यूज़र", "क्रिया", "विवरण", "समय"],
      rows.map((log) => [log.id, log.actor, log.action, log.detail, log.createdAt.toISOString()]),
    );
    return csvResponse(csv, "audit-logs.csv");
  }

  if (type === "documents") {
    const rows = await db.select().from(applicationDocuments);
    const csv = toCsv(
      ["ID", "आवेदन", "दस्तावेज़ प्रकार", "फाइल", "दिनांक"],
      rows.map((d) => [d.id, d.applicationId, d.docType, d.fileId, d.createdAt.toISOString()]),
    );
    return csvResponse(csv, "documents.csv");
  }

  if (type === "repairs") {
    const rows = await db.select().from(repairs);
    const csv = toCsv(
      ["जॉब", "ग्राहक", "मोबाइल", "डिवाइस", "समस्या", "टेक्नीशियन", "अनुमान", "अंतिम राशि", "स्थिति"],
      rows.map((r) => [r.jobNo, r.customerName, r.mobile, r.device, r.issue, r.technician, r.estimate, r.finalAmount, r.status]),
    );
    return csvResponse(csv, "repairs.csv");
  }

  return csvResponse(toCsv(["error"], [["अज्ञात रिपोर्ट प्रकार"]]), "unknown.csv");
}
