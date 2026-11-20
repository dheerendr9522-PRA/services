import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { applications, banners, bills, bookings, businessProfiles, categories, creditLedger, customButtons, customCards, customMenus, customPages, customers, expenses, feedback, inquiries, integrations, invoices, learnings, offers, products, purchases, payments, repairs, sales, services, users, websites } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type FieldType = "text" | "number" | "boolean" | "select" | "textarea" | "password" | "items" | "date" | "json";

export type ResourceField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

export type ResourceConfig = {
  key: string;
  label: string;
  table: PgTable;
  fields: ResourceField[];
  columns: { key: string; label: string }[];
  searchKeys: string[];
  orderBy: "createdAt" | "sortOrder" | "id" | "spentAt" | "soldAt" | "purchasedAt" | "displayOrder" | "paidAt";
  allowCreate: boolean;
  allowDelete: boolean;
  defaultSort?: "asc" | "desc";
};

export const STATUS_OPTIONS = ["Pending", "Processing", "Documents Pending", "Payment Pending", "In Progress", "Completed", "Rejected", "Cancelled"];
export const PAYMENT_OPTIONS = ["Cash", "UPI", "Mobile UPI", "Card", "Pending"];

export const resourceConfigs: Record<string, ResourceConfig> = {
  services: {
    key: "services",
    label: "सेवाएँ",
    table: services,
    fields: [
      { key: "nameHi", label: "सेवा नाम (हिंदी)", type: "text", required: true },
      { key: "nameEn", label: "Service Name (English)", type: "text", required: true },
      { key: "categoryId", label: "श्रेणी ID", type: "number", required: true },
      { key: "description", label: "विवरण", type: "textarea" },
      { key: "shopFee", label: "दुकान शुल्क ₹", type: "number" },
      { key: "govtFee", label: "सरकारी शुल्क ₹", type: "number" },
      { key: "bookingFee", label: "बुकिंग शुल्क ₹", type: "number" },
      { key: "timeEstimate", label: "अनुमानित समय", type: "text" },
      { key: "officialUrl", label: "ऑफिशियल URL", type: "text" },
      { key: "serviceMode", label: "सेवा कहाँ होगी", type: "select", options: ["shop", "online", "both"] },
      { key: "onlineModeNote", label: "बिना दुकान आए (ऑनलाइन) सेवा विवरण", type: "textarea" },
      { key: "documents", label: "आवश्यक दस्तावेज़ (कॉमा से अलग)", type: "text" },
      { key: "formFields", label: "सेवा-विशेष फॉर्म फील्ड (JSON)", type: "json", placeholder: '[{"key":"travelDate","label":"यात्रा तिथि","type":"date","required":true}]' },
      { key: "feeStatus", label: "शुल्क स्थिति", type: "select", options: ["Owner-configured", "Estimated", "Verified"] },
      { key: "featured", label: "लोकप्रिय सेवा", type: "boolean" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [
      { key: "nameHi", label: "सेवा" },
      { key: "categoryId", label: "श्रेणी" },
      { key: "shopFee", label: "शुल्क" },
      { key: "timeEstimate", label: "समय" },
      { key: "serviceMode", label: "मोड" },
      { key: "active", label: "स्थिति" },
    ],
    searchKeys: ["nameHi", "nameEn"],
    orderBy: "sortOrder",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "asc",
  },
  categories: {
    key: "categories",
    label: "श्रेणियाँ",
    table: categories,
    fields: [
      { key: "nameHi", label: "श्रेणी नाम (हिंदी)", type: "text", required: true },
      { key: "nameEn", label: "Category Name (English)", type: "text", required: true },
      { key: "slug", label: "Slug (URL)", type: "text", required: true },
      { key: "icon", label: "आइकन", type: "text" },
      { key: "groupKey", label: "मेन्यू ग्रुप", type: "select", options: ["digital", "shop"] },
      { key: "description", label: "विवरण", type: "textarea" },
      { key: "sortOrder", label: "क्रम", type: "number" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [
      { key: "nameHi", label: "श्रेणी" },
      { key: "slug", label: "Slug" },
      { key: "groupKey", label: "ग्रुप" },
      { key: "active", label: "स्थिति" },
    ],
    searchKeys: ["nameHi", "nameEn", "slug"],
    orderBy: "sortOrder",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "asc",
  },
  websites: {
    key: "websites",
    label: "ऑफिशियल वेबसाइट",
    table: websites,
    fields: [
      { key: "name", label: "वेबसाइट नाम", type: "text", required: true },
      { key: "url", label: "URL", type: "text", required: true },
      { key: "section", label: "वर्ग", type: "select", options: ["mp", "central", "tech"] },
      { key: "groupLabel", label: "श्रेणी (Category label)", type: "text" },
      { key: "note", label: "नोट", type: "text" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [
      { key: "name", label: "नाम" },
      { key: "url", label: "URL" },
      { key: "groupLabel", label: "श्रेणी" },
      { key: "active", label: "स्थिति" },
    ],
    searchKeys: ["name", "url"],
    orderBy: "sortOrder",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "asc",
  },
  applications: {
    key: "applications",
    label: "आवेदन",
    table: applications,
    fields: [
      { key: "customerName", label: "ग्राहक नाम", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text", required: true },
      { key: "serviceName", label: "सेवा", type: "text", required: true },
      { key: "status", label: "स्थिति", type: "select", options: STATUS_OPTIONS },
      { key: "amount", label: "राशि ₹", type: "number" },
      { key: "paymentMode", label: "भुगतान", type: "select", options: ["UPI", "Cash", "Mobile UPI"] },
      { key: "utr", label: "UTR / Txn ID", type: "text" },
      { key: "address", label: "पता", type: "text" },
      { key: "notes", label: "ग्राहक नोट", type: "textarea" },
      { key: "adminNote", label: "एडमिन नोट", type: "textarea" },
    ],
    columns: [
      { key: "refNo", label: "Ref" },
      { key: "customerName", label: "ग्राहक" },
      { key: "serviceName", label: "सेवा" },
      { key: "status", label: "स्थिति" },
      { key: "amount", label: "राशि" },
    ],
    searchKeys: ["refNo", "customerName", "mobile", "serviceName"],
    orderBy: "createdAt",
    allowCreate: false,
    allowDelete: true,
    defaultSort: "desc",
  },
  customers: {
    key: "customers",
    label: "ग्राहक",
    table: customers,
    fields: [
      { key: "name", label: "नाम", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text", required: true },
      { key: "address", label: "पता", type: "text" },
      { key: "village", label: "गाँव", type: "text" },
      { key: "email", label: "ईमेल", type: "text" },
      { key: "active", label: "सक्रिय", type: "boolean" },
    ],
    columns: [
      { key: "name", label: "नाम" },
      { key: "mobile", label: "मोबाइल" },
      { key: "village", label: "गाँव" },
      { key: "active", label: "स्थिति" },
    ],
    searchKeys: ["name", "mobile", "village"],
    orderBy: "createdAt",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "desc",
  },
  repairs: {
    key: "repairs",
    label: "रिपेयर जॉब",
    table: repairs,
    fields: [
      { key: "jobNo", label: "जॉब नंबर", type: "text" },
      { key: "customerName", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text", required: true },
      { key: "device", label: "डिवाइस", type: "text", required: true },
      { key: "issue", label: "समस्या", type: "text", required: true },
      { key: "technician", label: "टेक्नीशियन", type: "text" },
      { key: "estimate", label: "अनुमान ₹", type: "number" },
      { key: "finalAmount", label: "अंतिम राशि ₹", type: "number" },
      { key: "status", label: "स्थिति", type: "select", options: STATUS_OPTIONS },
      { key: "notes", label: "नोट", type: "textarea" },
    ],
    columns: [
      { key: "jobNo", label: "Job" },
      { key: "customerName", label: "ग्राहक" },
      { key: "device", label: "डिवाइस" },
      { key: "status", label: "स्थिति" },
      { key: "finalAmount", label: "राशि" },
    ],
    searchKeys: ["jobNo", "customerName", "mobile", "device"],
    orderBy: "createdAt",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "desc",
  },
  invoices: {
    key: "invoices",
    label: "इनवॉइस",
    table: invoices,
    fields: [
      { key: "invoiceNo", label: "इनवॉइस नंबर", type: "text" },
      { key: "customerName", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text", required: true },
      { key: "items", label: "आइटम (प्रति पंक्ति: नाम, qty, rate)", type: "items" },
      { key: "discount", label: "छूट ₹", type: "number" },
      { key: "tax", label: "टैक्स ₹", type: "number" },
      { key: "paymentMode", label: "भुगतान", type: "select", options: PAYMENT_OPTIONS },
      { key: "status", label: "स्थिति", type: "select", options: ["Paid", "Pending", "Cancelled"] },
      { key: "notes", label: "नोट", type: "textarea" },
    ],
    columns: [
      { key: "invoiceNo", label: "इनवॉइस" },
      { key: "customerName", label: "ग्राहक" },
      { key: "total", label: "कुल" },
      { key: "paymentMode", label: "भुगतान" },
      { key: "status", label: "स्थिति" },
    ],
    searchKeys: ["invoiceNo", "customerName", "mobile"],
    orderBy: "createdAt",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "desc",
  },
  expenses: {
    key: "expenses",
    label: "खर्च",
    table: expenses,
    fields: [
      { key: "title", label: "खर्च शीर्षक", type: "text", required: true, placeholder: "जैसे दुकान किराया" },
      { key: "category", label: "श्रेणी", type: "select", options: ["दुकान किराया", "बिजली बिल", "इंटरनेट", "स्टेशनरी", "हार्डवेयर पार्ट्स", "सैलरी", "यात्रा", "मार्केटिंग", "अन्य"] },
      { key: "amount", label: "राशि ₹", type: "number", required: true },
      { key: "paidTo", label: "भुगतान किसे", type: "text" },
      { key: "spentAt", label: "खर्च दिनांक", type: "date" },
      { key: "note", label: "नोट", type: "textarea" },
    ],
    columns: [
      { key: "title", label: "शीर्षक" },
      { key: "category", label: "श्रेणी" },
      { key: "amount", label: "राशि" },
      { key: "paidTo", label: "किसे" },
      { key: "spentAt", label: "दिनांक" },
    ],
    searchKeys: ["title", "category", "paidTo", "note"],
    orderBy: "spentAt",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "desc",
  },
  products: {
    key: "products", label: "स्टॉक उत्पाद", table: products,
    fields: [
      { key: "name", label: "उत्पाद का नाम", type: "text", required: true },
      { key: "code", label: "कोड", type: "text" },
      { key: "category", label: "श्रेणी", type: "text" },
      { key: "buyPrice", label: "खरीद मूल्य ₹", type: "number" },
      { key: "sellPrice", label: "बिक्री मूल्य ₹", type: "number" },
      { key: "stock", label: "वर्तमान स्टॉक", type: "number" },
      { key: "minStock", label: "न्यूनतम स्टॉक (चेतावनी)", type: "number" },
      { key: "imageUrl", label: "फोटो URL", type: "text" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [
      { key: "name", label: "उत्पाद" }, { key: "code", label: "कोड" }, { key: "stock", label: "स्टॉक" },
      { key: "buyPrice", label: "खरीद" }, { key: "sellPrice", label: "बिक्री" }, { key: "active", label: "ON/OFF" },
    ],
    searchKeys: ["name", "code", "category"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  sales: {
    key: "sales", label: "बिक्री / बिल", table: sales,
    fields: [
      { key: "billNo", label: "बिल नंबर (खाली = ऑटो)", type: "text" },
      { key: "customerName", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text" },
      { key: "itemName", label: "सामान / सेवा", type: "text", required: true },
      { key: "qty", label: "मात्रा", type: "number" },
      { key: "rate", label: "दर ₹", type: "number" },
      { key: "discount", label: "छूट ₹", type: "number" },
      { key: "paymentMode", label: "भुगतान", type: "select", options: ["Cash", "UPI", "Bank Transfer", "Credit"] },
      { key: "status", label: "स्थिति", type: "select", options: ["Paid", "Credit", "Cancelled"] },
      { key: "soldAt", label: "बिक्री तिथि", type: "date" },
      { key: "note", label: "नोट", type: "textarea" },
    ],
    columns: [
      { key: "billNo", label: "बिल" }, { key: "customerName", label: "ग्राहक" }, { key: "itemName", label: "सामान" },
      { key: "amount", label: "राशि" }, { key: "paymentMode", label: "भुगतान" }, { key: "status", label: "स्थिति" },
    ],
    searchKeys: ["billNo", "customerName", "mobile", "itemName"], orderBy: "soldAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  purchases: {
    key: "purchases", label: "खरीद", table: purchases,
    fields: [
      { key: "supplier", label: "सप्लायर", type: "text", required: true },
      { key: "billNo", label: "सप्लायर बिल नंबर", type: "text" },
      { key: "itemName", label: "सामान", type: "text", required: true },
      { key: "qty", label: "मात्रा", type: "number" },
      { key: "rate", label: "दर ₹", type: "number" },
      { key: "paymentMode", label: "भुगतान", type: "select", options: ["Cash", "UPI", "Bank Transfer", "Credit"] },
      { key: "purchasedAt", label: "खरीद तिथि", type: "date" },
      { key: "note", label: "नोट", type: "textarea" },
    ],
    columns: [
      { key: "supplier", label: "सप्लायर" }, { key: "billNo", label: "बिल" }, { key: "itemName", label: "सामान" },
      { key: "qty", label: "मात्रा" }, { key: "amount", label: "राशि" }, { key: "paymentMode", label: "भुगतान" },
    ],
    searchKeys: ["supplier", "billNo", "itemName"], orderBy: "purchasedAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  credit: {
    key: "credit", label: "ग्राहक उधारी", table: creditLedger,
    fields: [
      { key: "customerName", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text" },
      { key: "totalAmount", label: "कुल उधार ₹", type: "number" },
      { key: "paidAmount", label: "प्राप्त भुगतान ₹", type: "number" },
      { key: "note", label: "विवरण", type: "textarea" },
      { key: "status", label: "स्थिति", type: "select", options: ["Pending", "Partial", "Paid"] },
    ],
    columns: [
      { key: "customerName", label: "ग्राहक" }, { key: "mobile", label: "मोबाइल" }, { key: "totalAmount", label: "कुल" },
      { key: "paidAmount", label: "जमा" }, { key: "status", label: "स्थिति" },
    ],
    searchKeys: ["customerName", "mobile", "note"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  bookings: {
    key: "bookings", label: "सेवा बुकिंग", table: bookings,
    fields: [
      { key: "serviceName", label: "सेवा", type: "text", required: true },
      { key: "customerName", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text", required: true },
      { key: "details", label: "विवरण", type: "textarea" },
      { key: "quantity", label: "मात्रा / पैकेज", type: "text" },
      { key: "fee", label: "अनुमानित शुल्क ₹", type: "number" },
      { key: "status", label: "स्थिति", type: "select", options: ["New Request", "In Progress", "Completed", "Delivered", "Rejected"] },
    ],
    columns: [
      { key: "refNo", label: "ID" }, { key: "serviceName", label: "सेवा" }, { key: "customerName", label: "ग्राहक" },
      { key: "fee", label: "शुल्क" }, { key: "status", label: "स्थिति" },
    ],
    searchKeys: ["refNo", "serviceName", "customerName", "mobile"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  offers: {
    key: "offers", label: "ऑफर", table: offers,
    fields: [
      { key: "title", label: "ऑफर का नाम", type: "text", required: true },
      { key: "discount", label: "छूट (जैसे 25%)", type: "text" },
      { key: "offerType", label: "ऑफर प्रकार", type: "select", options: ["simple", "buy1get1", "combo", "freegift", "multi"] },
      { key: "buyQty", label: "Buy (मात्रा)", type: "number" },
      { key: "getQty", label: "Get Free (मात्रा)", type: "number" },
      { key: "freeItem", label: "फ्री आइटम", type: "text" },
      { key: "comboItems", label: "कॉम्बो आइटम (कॉमा से अलग)", type: "text" },
      { key: "relatedService", label: "संबंधित उत्पाद / सेवा", type: "text" },
      { key: "terms", label: "नियम व शर्तें", type: "textarea" },
      { key: "detail", label: "विवरण", type: "textarea" },
      { key: "imageUrl", label: "ऑफर फोटो URL", type: "text" },
      { key: "startDate", label: "शुरू तारीख", type: "date" },
      { key: "endDate", label: "समाप्ति तारीख", type: "date" },
      { key: "linkUrl", label: "लिंक (जैसे /services)", type: "text" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [
      { key: "title", label: "ऑफर" }, { key: "offerType", label: "प्रकार" }, { key: "discount", label: "छूट" }, { key: "endDate", label: "समाप्ति" }, { key: "active", label: "ON/OFF" },
    ],
    searchKeys: ["title", "detail", "discount"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  feedback: {
    key: "feedback", label: "फीडबैक", table: feedback,
    fields: [
      { key: "name", label: "ग्राहक", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text" },
      { key: "rating", label: "रेटिंग (1–5)", type: "number" },
      { key: "comment", label: "राय", type: "textarea" },
      { key: "reply", label: "दुकान का जवाब", type: "textarea" },
      { key: "serviceName", label: "सेवा", type: "text" },
      { key: "active", label: "प्रकाशित", type: "boolean" },
    ],
    columns: [
      { key: "name", label: "ग्राहक" }, { key: "rating", label: "रेटिंग" }, { key: "comment", label: "राय" },
      { key: "reply", label: "जवाब" }, { key: "active", label: "प्रकाशित" },
    ],
    searchKeys: ["name", "mobile", "comment", "serviceName"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  banners: {
    key: "banners", label: "बैनर", table: banners,
    fields: [
      { key: "title", label: "बैनर शीर्षक", type: "text", required: true },
      { key: "subtitle", label: "उप-शीर्षक", type: "text" },
      { key: "description", label: "विवरण", type: "textarea" },
      { key: "imageUrl", label: "डेस्कटॉप इमेज URL", type: "text" },
      { key: "mobileImageUrl", label: "मोबाइल इमेज URL", type: "text" },
      { key: "buttonLabel", label: "बटन लेबल", type: "text" },
      { key: "buttonLink", label: "बटन लिंक", type: "text" },
      { key: "secondaryLabel", label: "दूसरा बटन लेबल", type: "text" },
      { key: "secondaryLink", label: "दूसरा बटन लिंक", type: "text" },
      { key: "targetPage", label: "किस पेज पर", type: "select", options: ["home", "services", "admin", "customer", "offers", "business", "login", "directory", "learning", "billing"] },
      { key: "position", label: "स्थान", type: "select", options: ["top-header", "below-header", "above-heading", "below-heading", "above-footer", "sidebar", "between-sections"] },
      { key: "displayType", label: "प्रकार", type: "select", options: ["hero", "promotional", "offer", "announcement", "image", "small", "carousel"] },
      { key: "bgColor", label: "बैकग्राउंड रंग", type: "text" },
      { key: "textColor", label: "टेक्स्ट रंग", type: "text" },
      { key: "overlayOpacity", label: "ओवरले ओपेसिटी", type: "number" },
      { key: "radius", label: "कोना गोलाई", type: "number" },
      { key: "startDate", label: "शुरू तारीख", type: "date" },
      { key: "endDate", label: "समाप्ति तारीख", type: "date" },
      { key: "displayOrder", label: "क्रम", type: "number" },
      { key: "status", label: "स्थिति", type: "select", options: ["Draft", "Scheduled", "Active", "Expired", "Inactive"] },
      { key: "active", label: "ON/OFF", type: "boolean" },
      { key: "altText", label: "Alt Text", type: "text" },
    ],
    columns: [{ key: "title", label: "शीर्षक" }, { key: "targetPage", label: "पेज" }, { key: "active", label: "ON/OFF" }],
    searchKeys: ["title", "targetPage", "position"], orderBy: "displayOrder", allowCreate: true, allowDelete: true, defaultSort: "asc",
  },
  learnings: {
    key: "learnings", label: "सेवा ट्रेनिंग", table: learnings,
    fields: [
      { key: "serviceName", label: "सेवा का नाम", type: "text", required: true },
      { key: "serviceSlug", label: "सेवा slug (लिंक हेतु)", type: "text" },
      { key: "intro", label: "परिचय", type: "textarea" },
      { key: "eligibility", label: "पात्रता", type: "textarea" },
      { key: "documents", label: "आवश्यक दस्तावेज़", type: "textarea" },
      { key: "officialUrl", label: "आधिकारिक वेबसाइट", type: "text" },
      { key: "mistakes", label: "सामान्य गलतियाँ", type: "textarea" },
      { key: "videoUrl", label: "YouTube वीडियो URL", type: "text" },
      { key: "notesUrl", label: "PDF नोट्स URL", type: "text" },
      { key: "active", label: "ON/OFF", type: "boolean" },
    ],
    columns: [{ key: "serviceName", label: "सेवा" }, { key: "officialUrl", label: "वेबसाइट" }, { key: "active", label: "ON/OFF" }],
    searchKeys: ["serviceName", "intro", "eligibility"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  profiles: {
    key: "profiles", label: "बिज़नेस प्रोफाइल", table: businessProfiles,
    fields: [
      { key: "name", label: "बिज़नेस नाम", type: "text", required: true },
      { key: "slug", label: "Slug (URL)", type: "text", required: true },
      { key: "category", label: "श्रेणी", type: "text" },
      { key: "ownerName", label: "मालिक", type: "text" },
      { key: "phone", label: "फोन", type: "text" },
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "email", label: "ईमेल", type: "text" },
      { key: "address", label: "पता", type: "text" },
      { key: "mapsUrl", label: "Google Maps लिंक", type: "text" },
      { key: "description", label: "विवरण", type: "textarea" },
      { key: "servicesText", label: "सेवाएँ (कॉमा से अलग)", type: "textarea" },
      { key: "workingHours", label: "कार्य समय", type: "text" },
      { key: "logoUrl", label: "Logo URL", type: "text" },
      { key: "coverUrl", label: "Cover फोटो URL", type: "text" },
      { key: "websiteUrl", label: "वेबसाइट / सोशल लिंक", type: "text" },
      { key: "productsText", label: "उत्पाद (कॉमा से अलग)", type: "text" },
      { key: "socialLinks", label: "सोशल लिंक", type: "text" },
      { key: "template", label: "टेम्पलेट", type: "select", options: ["classic", "modern", "minimal", "bold"] },
      { key: "layout", label: "लेआउट", type: "select", options: ["hero", "split", "card"] },
      { key: "primaryColor", label: "मुख्य रंग", type: "text" },
      { key: "accentColor", label: "दूसरा रंग", type: "text" },
      { key: "ownerMobile", label: "स्वामी मोबाइल (कस्टमर कनेक्ट)", type: "text" },
      { key: "published", label: "प्रकाशित", type: "boolean" },
    ],
    columns: [{ key: "name", label: "बिज़नेस" }, { key: "category", label: "श्रेणी" }, { key: "views", label: "व्यू" }, { key: "published", label: "प्रकाशित" }],
    searchKeys: ["name", "slug", "category", "ownerName"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  inquiries: {
    key: "inquiries", label: "पूछताछ", table: inquiries,
    fields: [
      { key: "profileSlug", label: "प्रोफाइल slug", type: "text" },
      { key: "name", label: "नाम", type: "text", required: true },
      { key: "mobile", label: "मोबाइल", type: "text" },
      { key: "message", label: "संदेश", type: "textarea" },
      { key: "status", label: "स्थिति", type: "select", options: ["New", "Replied", "Closed"] },
    ],
    columns: [{ key: "name", label: "नाम" }, { key: "mobile", label: "मोबाइल" }, { key: "message", label: "संदेश" }, { key: "status", label: "स्थिति" }],
    searchKeys: ["name", "mobile", "message"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  integrations: {
    key: "integrations", label: "वेबसाइट / ऐप", table: integrations,
    fields: [
      { key: "name", label: "नाम", type: "text", required: true },
      { key: "type", label: "प्रकार", type: "select", options: ["website", "app", "sheet", "api"] },
      { key: "url", label: "URL", type: "text" },
      { key: "description", label: "विवरण", type: "textarea" },
      { key: "logoUrl", label: "Logo / Icon URL", type: "text" },
      { key: "relatedService", label: "संबंधित सेवा", type: "text" },
      { key: "loginType", label: "लॉगिन / एक्सेस प्रकार", type: "text" },
      { key: "dbType", label: "डेटाबेस प्रकार", type: "text" },
      { key: "sheetId", label: "Spreadsheet ID", type: "text" },
      { key: "sheetName", label: "Sheet नाम", type: "text" },
      { key: "webhookUrl", label: "Webhook URL", type: "text" },
      { key: "status", label: "स्थिति", type: "select", options: ["Active", "Disabled", "Draft"] },
      { key: "notes", label: "नोट्स", type: "textarea" },
    ],
    columns: [{ key: "name", label: "नाम" }, { key: "type", label: "प्रकार" }, { key: "url", label: "URL" }, { key: "status", label: "स्थिति" }],
    searchKeys: ["name", "url", "type", "relatedService"], orderBy: "createdAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  payments: {
    key: "payments", label: "भुगतान", table: payments,
    fields: [
      { key: "billNo", label: "बिल नंबर", type: "text" },
      { key: "customerName", label: "ग्राहक", type: "text" },
      { key: "amount", label: "राशि ₹", type: "number" },
      { key: "paymentMode", label: "माध्यम", type: "select", options: ["Cash", "UPI", "Bank Transfer", "Other"] },
      { key: "reference", label: "UTR / Reference", type: "text" },
      { key: "note", label: "नोट", type: "text" },
    ],
    columns: [{ key: "billNo", label: "बिल" }, { key: "customerName", label: "ग्राहक" }, { key: "amount", label: "राशि" }, { key: "paymentMode", label: "माध्यम" }],
    searchKeys: ["billNo", "customerName", "reference"], orderBy: "paidAt", allowCreate: true, allowDelete: true, defaultSort: "desc",
  },
  menusDesigner: {
    key: "menusDesigner", label: "कस्टम मेन्यू", table: customMenus,
    fields: [
      { key: "label", label: "मेन्यू नाम", type: "text", required: true },
      { key: "href", label: "लिंक (जैसे /services या /p/page)", type: "text", required: true },
      { key: "icon", label: "आइकन", type: "text" },
      { key: "parent", label: "पैरेंट मेन्यू", type: "text" },
      { key: "sortOrder", label: "क्रम", type: "number" },
      { key: "openNewTab", label: "नए टैब में खोलें", type: "boolean" },
      { key: "visible", label: "दिखाएँ", type: "boolean" },
      { key: "roles", label: "किसके लिए", type: "select", options: ["all", "staff", "customer"] },
    ],
    columns: [{ key: "label", label: "मेन्यू" }, { key: "href", label: "लिंक" }, { key: "sortOrder", label: "क्रम" }, { key: "visible", label: "दिखे" }],
    searchKeys: ["label", "href"], orderBy: "sortOrder", allowCreate: true, allowDelete: true, defaultSort: "asc",
  },
  pages: {
    key: "pages", label: "कस्टम पेज", table: customPages,
    fields: [
      { key: "title", label: "पेज शीर्षक", type: "text", required: true },
      { key: "slug", label: "Slug (URL) — जैसे digital-seva-guide", type: "text", required: true },
      { key: "subtitle", label: "उप-शीर्षक", type: "text" },
      { key: "sections", label: "सेक्शन (JSON array)", type: "json", placeholder: '[{"type":"section","title":"शीर्षक","text":"विवरण","buttonLabel":"देखें","buttonHref":"/services"}]' },
      { key: "published", label: "प्रकाशित", type: "boolean" },
      { key: "sortOrder", label: "क्रम", type: "number" },
    ],
    columns: [{ key: "title", label: "पेज" }, { key: "slug", label: "Slug" }, { key: "published", label: "प्रकाशित" }],
    searchKeys: ["title", "slug"], orderBy: "sortOrder", allowCreate: true, allowDelete: true, defaultSort: "asc",
  },
  cards: {
    key: "cards", label: "कार्ड", table: customCards,
    fields: [
      { key: "title", label: "कार्ड शीर्षक", type: "text", required: true },
      { key: "subtitle", label: "विवरण", type: "text" },
      { key: "icon", label: "आइकन", type: "text" },
      { key: "imageUrl", label: "फोटो URL", type: "text" },
      { key: "bgColor", label: "बैकग्राउंड रंग", type: "text" },
      { key: "textColor", label: "टेक्स्ट रंग", type: "text" },
      { key: "radius", label: "कोना गोलाई", type: "number" },
      { key: "href", label: "क्लिक पर लिंक", type: "text" },
      { key: "surface", label: "कहाँ दिखे", type: "select", options: ["home", "services", "admin", "customer"] },
      { key: "sortOrder", label: "क्रम", type: "number" },
      { key: "visible", label: "दिखाएँ", type: "boolean" },
    ],
    columns: [{ key: "title", label: "कार्ड" }, { key: "surface", label: "कहाँ" }, { key: "sortOrder", label: "क्रम" }, { key: "visible", label: "दिखे" }],
    searchKeys: ["title", "subtitle"], orderBy: "sortOrder", allowCreate: true, allowDelete: true, defaultSort: "asc",
  },
  buttons: {
    key: "buttons", label: "बटन", table: customButtons,
    fields: [
      { key: "label", label: "बटन टेक्स्ट", type: "text", required: true },
      { key: "icon", label: "आइकन", type: "text" },
      { key: "href", label: "लिंक / क्रिया", type: "text" },
      { key: "action", label: "क्रिया प्रकार", type: "select", options: ["link", "call", "whatsapp", "share"] },
      { key: "bgColor", label: "बैकग्राउंड रंग", type: "text" },
      { key: "textColor", label: "टेक्स्ट रंग", type: "text" },
      { key: "style", label: "आकार", type: "select", options: ["rounded", "pill", "square", "outline"] },
      { key: "surface", label: "कहाँ दिखे", type: "select", options: ["home", "services", "admin", "customer"] },
      { key: "sortOrder", label: "क्रम", type: "number" },
      { key: "visible", label: "दिखाएँ", type: "boolean" },
    ],
    columns: [{ key: "label", label: "बटन" }, { key: "href", label: "लिंक" }, { key: "sortOrder", label: "क्रम" }, { key: "visible", label: "दिखे" }],
    searchKeys: ["label", "href"], orderBy: "sortOrder", allowCreate: true, allowDelete: true, defaultSort: "asc",
  },
  users: {
    key: "users",
    label: "स्टाफ यूज़र",
    table: users,
    fields: [
      { key: "username", label: "यूज़रनेम / ID", type: "text", required: true },
      { key: "name", label: "नाम", type: "text", required: true },
      { key: "role", label: "भूमिका", type: "select", options: ["owner", "manager", "operator"] },
      { key: "password", label: "नया पासवर्ड (खाली छोड़ें तो पुराना रहेगा)", type: "password" },
      { key: "active", label: "सक्रिय", type: "boolean" },
    ],
    columns: [
      { key: "username", label: "ID" },
      { key: "name", label: "नाम" },
      { key: "role", label: "भूमिका" },
      { key: "active", label: "स्थिति" },
    ],
    searchKeys: ["username", "name", "role"],
    orderBy: "id",
    allowCreate: true,
    allowDelete: true,
    defaultSort: "asc",
  },
};

export type AnyRecord = Record<string, unknown>;

export function coerceValue(type: FieldType, raw: unknown): unknown {
  if (raw === undefined) return undefined;
  if (type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (type === "boolean") {
    return raw === true || raw === "true" || raw === "on" || raw === "1";
  }
  if (type === "items") {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, qty, rate] = line.split(",").map((p) => p.trim());
          return { label: label || "आइटम", qty: Number(qty) || 1, rate: Number(rate) || 0 };
        });
    }
    return [];
  }
  if (type === "date") {
    const text = String(raw ?? "").trim();
    if (!text) return new Date();
    const parsed = new Date(text.length <= 10 ? `${text}T10:00:00` : text);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (type === "json") {
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return [];
      }
    }
    return raw ?? [];
  }
  if (type === "select" && typeof raw === "string") return raw;
  return raw === null || raw === undefined ? "" : String(raw);
}

export function preparePayload(config: ResourceConfig, body: AnyRecord, isCreate: boolean): AnyRecord {
  const output: AnyRecord = {};
  for (const field of config.fields) {
    if (!(field.key in body)) continue;
    if (field.type === "password") {
      const value = String(body[field.key] ?? "");
      if (value.trim()) output.passwordHash = hashPassword(value.trim());
      continue;
    }
    let value = coerceValue(field.type, body[field.key]);
    if ((field.key === "formFields" || field.key === "sections" || field.key === "gallery") && typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      value = [];
    }
  }
  if (field.key === "documents" && typeof value === "string") {
      value = value
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    }
    output[field.key] = value;
  }
  if (isCreate) {
    for (const field of config.fields) {
      if (field.type === "password") continue;
      if (output[field.key] === undefined && field.defaultValue !== undefined) {
        output[field.key] = field.defaultValue;
      }
    }
  }
  if (config.key === "invoices" && ("items" in output || isCreate)) {
    const items = (output.items as { label: string; qty: number; rate: number }[]) ?? [];
    const discount = Number(output.discount ?? 0);
    const tax = Number(output.tax ?? 0);
    output.total = items.reduce((sum, item) => sum + item.qty * item.rate, 0) - discount + tax;
  }
  if (isCreate && (config.key === "services" || config.key === "categories") && !output.slug) {
    const source =
      (typeof output.nameEn === "string" && output.nameEn) ||
      (typeof output.nameHi === "string" && output.nameHi) ||
      "";
    output.slug = slugify(String(source)) || `${config.key}-${Date.now().toString(36)}`;
  }
  if (config.key === "repairs" && isCreate && !output.jobNo) {
    output.jobNo = `RJ-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  if (config.key === "sales") {
    const qty = Number(output.qty ?? 1);
    const rate = Number(output.rate ?? 0);
    const discount = Number(output.discount ?? 0);
    output.amount = qty * rate - discount;
    if (isCreate && !output.billNo) output.billNo = `SAL-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  if (config.key === "purchases") {
    output.amount = Number(output.qty ?? 1) * Number(output.rate ?? 0);
  }
  if (config.key === "invoices" && isCreate && !output.invoiceNo) {
    output.invoiceNo = `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  return output;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function listResourceRows(
  config: ResourceConfig,
  search?: string,
  limit = 500,
): Promise<AnyRecord[]> {
  const rows = (await db.select().from(config.table as any)) as AnyRecord[];
  let filtered = rows;
  if (search) {
    const q = search.toLowerCase();
    filtered = rows.filter((row) =>
      config.searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)),
    );
  }
  const dir = config.defaultSort === "asc" ? 1 : -1;
  filtered = [...filtered].sort((a, b) => {
    const av = a[config.orderBy];
    const bv = b[config.orderBy];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return av > bv ? dir : -dir;
  });
  return filtered.slice(0, limit);
}

export async function findResourceRow(config: ResourceConfig, id: number): Promise<AnyRecord | null> {
  const rows = (await db
    .select()
    .from(config.table as any)
    .where(eq((config.table as any).id, id))
    .limit(1)) as AnyRecord[];
  return rows[0] ?? null;
}

export async function updateResourceRow(
  config: ResourceConfig,
  id: number,
  payload: AnyRecord,
): Promise<AnyRecord | undefined> {
  const rows = (await db
    .update(config.table as any)
    .set(payload as any)
    .where(eq((config.table as any).id, id))
    .returning()) as AnyRecord[];
  return rows[0];
}

export async function deleteResourceRow(config: ResourceConfig, id: number): Promise<void> {
  await db.delete(config.table as any).where(eq((config.table as any).id, id));
}

export async function insertResourceRow(
  config: ResourceConfig,
  payload: AnyRecord,
): Promise<AnyRecord | undefined> {
  const rows = (await db
    .insert(config.table as any)
    .values(payload as any)
    .returning()) as AnyRecord[];
  return rows[0];
}

export const CATEGORY_TABLE = categories;
export const SERVICE_TABLE = services;
