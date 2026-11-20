import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  banners,
  bills,
  bookings,
  businessProfiles,
  designVersions,
  inquiries,
  integrations,
  learnings,
  payments,
  categories,
  creditLedger,
  customButtons,
  customCards,
  customMenus,
  customPages,
  customers,
  feedback,
  offers,
  products,
  profileEvents,
  purchases,
  sales,
  expenses,
  files,
  invoices,
  notifications,
  repairs,
  services,
  settings,
  users,
  websites,
} from "@/db/schema";
import { categorySeed, serviceSeed, websiteSeed } from "@/db/catalog";
import { extraCategorySeed, extraServiceSeed, extraWebsiteSeed } from "@/db/catalogExtra";
import { hashPassword } from "@/lib/auth";
import { defaultSettings } from "@/lib/settings";
import { slugify } from "@/lib/utils";

const dayAgo = (days: number, hours = 0) =>
  new Date(Date.now() - days * 86_400_000 - hours * 3_600_000);

const demoCustomerSeed = [
  ["रामकिशोर पटेल", "9425012345", "ग्राम अमरपुर, अमानगंज", "रामकिशोर पटेल", "Gram Amarpur"],
  ["सुनीता देवी", "9893322411", "बाजार मोहल्ला, अमानगंज", "", ""],
  ["अजय सिंह राजपूत", "9009977812", "ग्राम हिनौता, पन्ना", "", ""],
  ["प्रीति तिवारी", "8817766543", "वार्ड 7, अमानगंज", "", ""],
  ["मोहन लाल यादव", "7776622190", "ग्राम सलेहा, पन्ना", "", ""],
  ["रुक्मणी बाई", "9340123456", "ग्राम कुंडलपुर", "", ""],
  ["शेख इरफ़ान", "8269301456", "पन्ना रोड, अमानगंज", "", ""],
  ["ज्योति चौरसिया", "7000123987", "ग्राम गढ़ी, पन्ना", "", ""],
  ["अमित कुमार", "7610420959", "Bajar Mohalla, Amanganj", "", ""],
];

export async function seedDatabase(): Promise<{ seeded: boolean; services: number }> {
  // ---- Staff users ----
  const userCount = await db.select({ value: count() }).from(users);
  if (Number(userCount[0]?.value ?? 0) === 0) {
    await db.insert(users).values([
      {
        username: "dheerendra",
        name: "Dheerendra Prajapati",
        role: "owner",
        passwordHash: hashPassword("Dheeru@2026"),
        loginCount: 26,
        lastLoginAt: new Date(),
      },
      {
        username: "manager",
        name: "Shop Manager",
        role: "manager",
        passwordHash: hashPassword("Manager@2026"),
      },
      {
        username: "operator",
        name: "Counter Operator",
        role: "operator",
        passwordHash: hashPassword("Shop@2026"),
      },
    ]);
  }

  // ---- Settings defaults ----
  await db
    .insert(settings)
    .values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })))
    .onConflictDoNothing();

  // ---- Categories ----
  await db
    .insert(categories)
    .values(
      [...categorySeed, ...extraCategorySeed].map((c, index) => ({
        slug: c.slug,
        nameHi: c.nameHi,
        nameEn: c.nameEn,
        icon: c.icon,
        groupKey: c.groupKey,
        description: c.description,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoNothing();

  const categoryRows = await db.select().from(categories);
  const categoryBySlug = new Map(categoryRows.map((c) => [c.slug, c]));

  // ---- Services ----
  const existingServices = await db
    .select({ slug: services.slug, nameEn: services.nameEn, categoryId: services.categoryId })
    .from(services);
  const existingServiceSlugs = new Set(existingServices.map((r) => r.slug));
  const existingServiceKeys = new Set(existingServices.map((r) => r.nameEn.trim().toLowerCase()));
  const usedSlugs = new Set(existingServiceSlugs);
  const toInsert: (typeof services.$inferInsert)[] = [];
  let order = 1;
  for (const [catSlug, list] of Object.entries({ ...serviceSeed, ...extraServiceSeed })) {
    const category = categoryBySlug.get(catSlug);
    if (!category) continue;
    for (const tuple of list) {
      const [nameHi, nameEn, shopFee, govtFee, bookingFee, timeEstimate, docs, url] = tuple;
      const naturalKey = nameEn.trim().toLowerCase();
      if (existingServiceKeys.has(naturalKey)) continue;
      existingServiceKeys.add(naturalKey);
      let slug = slugify(nameEn);
      let i = 2;
      while (usedSlugs.has(slug)) {
        slug = `${slugify(nameEn)}-${i}`;
        i += 1;
      }
      usedSlugs.add(slug);
      const featured = shopFee >= 100 && (catSlug === "government" || catSlug === "hardware");
      toInsert.push({
        slug,
        categoryId: category.id,
        nameHi,
        nameEn,
        description: `${nameHi} — ${category.nameHi} श्रेणी की सेवा। दुकान पर आवेदन, दस्तावेज़ अपलोड व स्थिति ट्रैकिंग की सुविधा। शुल्क दुकान द्वारा निर्धारित/अनुमानित है; सरकारी शुल्क बदल सकता है।`,
        documents: docs ? docs.split(",").map((d) => d.trim()) : ["आधार कार्ड", "मोबाइल नंबर"],
        shopFee,
        govtFee,
        bookingFee,
        feeStatus: order <= 32 ? "Owner-configured" : "Estimated",
        timeEstimate,
        officialUrl: url ?? "",
        featured,
        sortOrder: order,
      });
      order += 1;
    }
  }
  let insertedServices = 0;
  for (let i = 0; i < toInsert.length; i += 60) {
    const chunk = toInsert.slice(i, i + 60);
    const inserted = await db.insert(services).values(chunk).onConflictDoNothing().returning({ id: services.id });
    insertedServices += inserted.length;
  }

  // ---- Websites ----
  const websiteRows = await db.select({ value: count() }).from(websites);
  if (Number(websiteRows[0]?.value ?? 0) < websiteSeed.length + extraWebsiteSeed.length) {
    const existing = new Set((await db.select({ url: websites.url }).from(websites)).map((w) => w.url));
    const all = (websiteSeed.map((w) => ({ ...w, groupLabel: "" })) as { name: string; url: string; section: string; groupLabel: string }[]).concat(
      extraWebsiteSeed,
    );
    const seen = new Set(existing);
    const missing = all
      .map((w, index) => ({ ...w, sortOrder: index + 1 }))
      .filter((w) => {
        if (seen.has(w.url)) return false;
        seen.add(w.url);
        return true;
      });
    if (missing.length) {
      for (let i = 0; i < missing.length; i += 50) {
        await db.insert(websites).values(missing.slice(i, i + 50));
      }
    }
  }

  // ---- Customers ----
  const customerCount = await db.select({ value: count() }).from(customers);
  if (Number(customerCount[0]?.value ?? 0) === 0) {
    await db.insert(customers).values(
      demoCustomerSeed.map(([name, mobile, address, email, village], index) => ({
        name,
        mobile,
        address,
        email: email || (index === 0 ? "ramkishor@example.com" : ""),
        village,
        createdAt: dayAgo(40 - index * 4),
      })),
    );
  }

  // ---- Files (completed work demo) ----
  const fileCount = await db.select({ value: count() }).from(files);
  let completedFileId: number | null = null;
  if (Number(fileCount[0]?.value ?? 0) === 0) {
    const demoText = Buffer.from(
      "DHEERENDRA PRAJAPATI DIGITAL SEVA KENDRA\nBajar Mohalla, Amanganj, Panna (M.P.) 488441\n\nDEMO COMPLETED WORK DOCUMENT\nReference: DP-R2001 | Customer: Ramkishor Patel\nThis is a demo deliverable generated for the live preview.\n",
      "utf8",
    ).toString("base64");
    const inserted = await db
      .insert(files)
      .values({
        name: "DP-R2001-completed-aadhaar.txt",
        mime: "text/plain",
        size: 260,
        data: demoText,
      })
      .returning({ id: files.id });
    completedFileId = inserted[0]?.id ?? null;
  } else {
    const existingFile = await db.select({ id: files.id }).from(files).limit(1);
    completedFileId = existingFile[0]?.id ?? null;
  }

  // ---- Applications ----
  const appCount = await db.select({ value: count() }).from(applications);
  if (Number(appCount[0]?.value ?? 0) === 0) {
    const allServices = await db
      .select({ id: services.id, slug: services.slug, nameHi: services.nameHi, shopFee: services.shopFee })
      .from(services)
      .limit(400);
    const pick = (slug: string) => allServices.find((s) => s.slug === slug) ?? allServices[0];
    const aadhaar = pick("aadhaar-update-assistance");
    const income = pick("income-certificate");
    const ladli = pick("ladli-behna-yojana-assistance");
    const laptop = pick("laptop-repair");
    const pan = pick("pan-card-new-correction-e-pan");
    const print = pick("b-w-print-photocopy-2-page");
    await db.insert(applications).values([
      {
        refNo: "DP-R2001",
        serviceId: aadhaar.id,
        serviceSlug: aadhaar.slug,
        serviceName: aadhaar.nameHi,
        customerName: "रामकिशोर पटेल",
        mobile: "9425012345",
        whatsapp: "9425012345",
        guardianName: "श्री बलराम पटेल",
        address: "ग्राम अमरपुर, अमानगंज, पन्ना",
        email: "ramkishor@example.com",
        familyId: "SAM-448812",
        notes: "आधार में पता सुधार करवाना है।",
        amount: aadhaar.shopFee,
        paymentMode: "UPI",
        utr: "428891204455",
        status: "Completed",
        adminNote: "आधार अपडेट UIDAI पर स्वीकृत — तैयार दस्तावेज़ अपलोड किया गया।",
        completedFileId,
        completedFileName: "DP-R2001-completed-aadhaar.txt",
        createdAt: dayAgo(6),
        updatedAt: dayAgo(2),
      },
      {
        refNo: "DP-R2002",
        serviceId: income.id,
        serviceSlug: income.slug,
        serviceName: income.nameHi,
        customerName: "सुनीता देवी",
        mobile: "9893322411",
        whatsapp: "9893322411",
        guardianName: "श्री रमेश चंद्र",
        address: "बाजार मोहल्ला, अमानगंज",
        notes: "छात्रवृत्ति के लिए आय प्रमाण चाहिए।",
        amount: income.shopFee,
        paymentMode: "Cash",
        utr: "",
        status: "In Progress",
        adminNote: "तेहसील कार्यालय में आवेदन जमा।",
        createdAt: dayAgo(4),
        updatedAt: dayAgo(1),
      },
      {
        refNo: "DP-R2003",
        serviceId: ladli.id,
        serviceSlug: ladli.slug,
        serviceName: ladli.nameHi,
        customerName: "प्रीति तिवारी",
        mobile: "8817766543",
        address: "वार्ड 7, अमानगंज",
        notes: "लाड़ली बहना योजना की किस्त जाँचनी है।",
        amount: ladli.shopFee,
        paymentMode: "UPI",
        utr: "772311900322",
        status: "Pending",
        createdAt: dayAgo(2),
        updatedAt: dayAgo(2),
      },
      {
        refNo: "DP-R2004",
        serviceId: laptop.id,
        serviceSlug: laptop.slug,
        serviceName: laptop.nameHi,
        customerName: "अजय सिंह राजपूत",
        mobile: "9009977812",
        address: "ग्राम हिनौता, पन्ना",
        notes: "लैपटॉप डिस्प्ले फ्लिकर कर रहा है।",
        amount: laptop.shopFee,
        paymentMode: "Cash",
        status: "In Progress",
        createdAt: dayAgo(3),
        updatedAt: dayAgo(1),
      },
      {
        refNo: "DP-R2005",
        serviceId: pan.id,
        serviceSlug: pan.slug,
        serviceName: pan.nameHi,
        customerName: "मोहन लाल यादव",
        mobile: "7776622190",
        address: "ग्राम सलेहा, पन्ना",
        notes: "नया पैन कार्ड बनवाना है।",
        amount: pan.shopFee + 107,
        paymentMode: "UPI",
        utr: "991200445577",
        status: "Completed",
        adminNote: "e-PAN डाउनलोड कर दिया गया।",
        completedFileId,
        completedFileName: "DP-R2005-epan.txt",
        createdAt: dayAgo(12),
        updatedAt: dayAgo(9),
      },
      {
        refNo: "DP-R2006",
        serviceId: print.id,
        serviceSlug: print.slug,
        serviceName: print.nameHi,
        customerName: "ज्योति चौरसिया",
        mobile: "7000123987",
        address: "ग्राम गढ़ी, पन्ना",
        notes: "20 पेज प्रिंट करवाने हैं।",
        amount: 40,
        paymentMode: "Cash",
        status: "Completed",
        createdAt: dayAgo(9),
        updatedAt: dayAgo(9),
      },
    ]);
  }

  // ---- Invoices ----
  const invoiceCount = await db.select({ value: count() }).from(invoices);
  if (Number(invoiceCount[0]?.value ?? 0) === 0) {
    await db.insert(invoices).values([
      {
        invoiceNo: "INV-1001",
        customerName: "अजय सिंह राजपूत",
        mobile: "9009977812",
        items: [
          { label: "Laptop Repair", qty: 1, rate: 600 },
          { label: "SSD 256GB", qty: 1, rate: 2100 },
        ],
        discount: 100,
        tax: 0,
        total: 2600,
        paymentMode: "UPI",
        status: "Paid",
        notes: "SSD अपग्रेड के साथ Windows इंस्टॉलेशन।",
        createdAt: dayAgo(5),
      },
      {
        invoiceNo: "INV-1002",
        customerName: "रामकिशोर पटेल",
        mobile: "9425012345",
        items: [
          { label: "आधार अपडेट सहायता", qty: 1, rate: 100 },
          { label: "B&W प्रिंट (20 पेज)", qty: 20, rate: 2 },
        ],
        discount: 0,
        tax: 0,
        total: 140,
        paymentMode: "UPI",
        status: "Paid",
        createdAt: dayAgo(6),
      },
      {
        invoiceNo: "INV-1003",
        customerName: "सुनीता देवी",
        mobile: "9893322411",
        items: [{ label: "आय प्रमाण पत्र", qty: 1, rate: 80 }],
        discount: 0,
        tax: 0,
        total: 80,
        paymentMode: "Cash",
        status: "Paid",
        createdAt: dayAgo(4),
      },
      {
        invoiceNo: "INV-1004",
        customerName: "मोहन लाल यादव",
        mobile: "7776622190",
        items: [
          { label: "PAN कार्ड नया", qty: 1, rate: 150 },
          { label: "प्रिंट व स्कैन", qty: 5, rate: 5 },
        ],
        discount: 0,
        tax: 0,
        total: 175,
        paymentMode: "UPI",
        status: "Paid",
        createdAt: dayAgo(10),
      },
      {
        invoiceNo: "INV-1005",
        customerName: "शेख इरफ़ान",
        mobile: "8269301456",
        items: [{ label: "CCTV Installation (4 कैमरा)", qty: 1, rate: 500 }],
        discount: 0,
        tax: 0,
        total: 500,
        paymentMode: "Cash",
        status: "Pending",
        notes: "बाकी राशि कैमरा सामग्री की।",
        createdAt: dayAgo(2),
      },
      {
        invoiceNo: "INV-1006",
        customerName: "प्रीति तिवारी",
        mobile: "8817766543",
        items: [
          { label: "पासपोर्ट फोटो", qty: 2, rate: 50 },
          { label: "लेमिनेशन", qty: 1, rate: 30 },
        ],
        discount: 0,
        tax: 0,
        total: 130,
        paymentMode: "Cash",
        status: "Paid",
        createdAt: dayAgo(1),
      },
    ]);
  }

  // ---- Repairs ----
  const repairCount = await db.select({ value: count() }).from(repairs);
  if (Number(repairCount[0]?.value ?? 0) === 0) {
    await db.insert(repairs).values([
      { jobNo: "RJ-2001", customerName: "अजय सिंह राजपूत", mobile: "9009977812", device: "Dell Inspiron 15", issue: "डिस्प्ले फ्लिकर व ओवरहीटिंग", technician: "Dheerendra", estimate: 1500, finalAmount: 0, status: "In Progress", notes: "थर्मल पेस्ट बदलना है।", createdAt: dayAgo(3) },
      { jobNo: "RJ-2002", customerName: "रामकिशोर पटेल", mobile: "9425012345", device: "HP Desktop", issue: "पावर ऑन नहीं हो रहा", technician: "Operator", estimate: 800, finalAmount: 750, status: "Completed", notes: "SMPS बदला गया।", createdAt: dayAgo(8) },
      { jobNo: "RJ-2003", customerName: "सुनीता देवी", mobile: "9893322411", device: "Canon G2010 प्रिंटर", issue: "प्रिंट में धारियाँ", technician: "Dheerendra", estimate: 600, finalAmount: 550, status: "Completed", createdAt: dayAgo(11) },
      { jobNo: "RJ-2004", customerName: "शेख इरफ़ान", mobile: "8269301456", device: "Lenovo IdeaPad", issue: "Windows बूट एरर", technician: "Manager", estimate: 500, finalAmount: 0, status: "Pending", createdAt: dayAgo(1) },
      { jobNo: "RJ-2005", customerName: "ज्योति चौरसिया", mobile: "7000123987", device: "Wi-Fi Router TP-Link", issue: "इंटरनेट डिस्कनेक्ट", technician: "Operator", estimate: 300, finalAmount: 300, status: "Completed", createdAt: dayAgo(6) },
      { jobNo: "RJ-2006", customerName: "मोहन लाल यादव", mobile: "7776622190", device: "CCTV DVR", issue: "रिकॉर्डिंग नहीं हो रही", technician: "Dheerendra", estimate: 1000, finalAmount: 0, status: "In Progress", createdAt: dayAgo(2) },
    ]);
  }

  // ---- Expenses ----
  const expenseCount = await db.select({ value: count() }).from(expenses);
  if (Number(expenseCount[0]?.value ?? 0) === 0) {
    await db.insert(expenses).values([
      { title: "दुकान किराया (मासिक)", category: "दुकान किराया", amount: 1500, paidTo: "श्री रमेश चंद्र", note: "बाजार मोहल्ला दुकान", spentAt: dayAgo(8) },
      { title: "बिजली बिल", category: "बिजली बिल", amount: 620, paidTo: "MPPKVVCL", note: "दुकान कनेक्शन", spentAt: dayAgo(6) },
      { title: "ब्रॉडबैंड इंटरनेट", category: "इंटरनेट", amount: 399, paidTo: "BSNL", note: "मासिक प्लान", spentAt: dayAgo(5) },
      { title: "प्रिंटर कार्टेज व पेपर", category: "स्टेशनरी", amount: 450, paidTo: "शर्मा स्टेशनरी", note: "रीम + रिफिल", spentAt: dayAgo(4) },
      { title: "SSD 256GB स्टॉक", category: "हार्डवेयर पार्ट्स", amount: 900, paidTo: "इंदौर कंप्यूटर मार्केट", note: "ग्राहक रिपेयर के लिए", spentAt: dayAgo(3) },
      { title: "करंट बिल (रिपेयर सेक्शन)", category: "बिजली बिल", amount: 250, paidTo: "MPPKVVCL", note: "अतिरिक्त कनेक्शन", spentAt: dayAgo(2) },
    ]);
  }

  // ---- Notifications ----
  const notificationCount = await db.select({ value: count() }).from(notifications);
  if (Number(notificationCount[0]?.value ?? 0) === 0) {
    await db.insert(notifications).values([
      { audience: "staff", title: "नई आवेदन प्राप्त", body: "DP-R2003 — लाड़ली बहना योजना सहायता (प्रीति तिवारी)", read: false, createdAt: dayAgo(0, 3) },
      { audience: "staff", title: "प्रिंटर रिपेयर जॉब अपडेट", body: "RJ-2003 पूरा हुआ, रसीद प्रिंट करें।", read: false, createdAt: dayAgo(1) },
      { audience: "all", title: "नई सेवा जोड़ी गई", body: "रेल टिकट बुकिंग सहायता अब उपलब्ध है।", read: true, createdAt: dayAgo(2) },
      { audience: "customer", title: "आपका काम पूरा हुआ", body: "DP-R2001 — तैयार दस्तावेज़ डाउनलोड करें।", read: false, createdAt: dayAgo(2) },
      { audience: "all", title: "UPI भुगतान सुविधा", body: "dheerendr9522@upi पर सीधा भुगतान करें, UTR दर्ज करें।", read: true, createdAt: dayAgo(5) },
    ]);
  }

  // ---- Products / commerce demo ----
  const productCount = await db.select({ value: count() }).from(products);
  if (Number(productCount[0]?.value ?? 0) === 0) {
    await db.insert(products).values([
      { name: "HP 15s लैपटॉप (i5 11th Gen)", code: "LAP-HP15", category: "लैपटॉप", buyPrice: 42000, sellPrice: 46500, stock: 2, minStock: 1 },
      { name: "SSD 256GB SATA", code: "SSD-256", category: "स्टोरेज", buyPrice: 1600, sellPrice: 2100, stock: 6, minStock: 3 },
      { name: "RAM DDR4 8GB", code: "RAM-8GB", category: "स्टोरेज", buyPrice: 1300, sellPrice: 1700, stock: 5, minStock: 3 },
      { name: "Epson 003 प्रिंटर कार्ट्रिज", code: "INK-003", category: "प्रिंटर", buyPrice: 550, sellPrice: 750, stock: 1, minStock: 4 },
      { name: "TP-Link Wi-Fi राउटर", code: "NET-TPL", category: "नेटवर्किंग", buyPrice: 900, sellPrice: 1250, stock: 3, minStock: 2 },
      { name: "CCTV कैमरा 2MP", code: "CCTV-2MP", category: "CCTV", buyPrice: 1200, sellPrice: 1650, stock: 4, minStock: 2 },
      { name: "कीबोर्ड + माउस कॉम्बो", code: "ACC-KM", category: "एक्सेसरीज़", buyPrice: 350, sellPrice: 550, stock: 8, minStock: 3 },
      { name: "UPS 600VA", code: "UPS-600", category: "पावर", buyPrice: 1700, sellPrice: 2200, stock: 2, minStock: 2 },
    ]);
  }

  const salesCount = await db.select({ value: count() }).from(sales);
  if (Number(salesCount[0]?.value ?? 0) === 0) {
    await db.insert(sales).values([
      { billNo: "SAL-1001", customerName: "अजय सिंह राजपूत", mobile: "9009977812", itemName: "SSD 256GB + Windows", qty: 1, rate: 2400, discount: 100, amount: 2300, paymentMode: "UPI", status: "Paid", soldAt: dayAgo(1) },
      { billNo: "SAL-1002", customerName: "रामकिशोर पटेल", mobile: "9425012345", itemName: "प्रिंट व फोटोकॉपी", qty: 20, rate: 2, discount: 0, amount: 40, paymentMode: "Cash", status: "Paid", soldAt: dayAgo(0, 4) },
      { billNo: "SAL-1003", customerName: "शेख इरफ़ान", mobile: "8269301456", itemName: "CCTV कैमरा 2MP", qty: 2, rate: 1650, discount: 100, amount: 3200, paymentMode: "Credit", status: "Pending", soldAt: dayAgo(2) },
      { billNo: "SAL-1004", customerName: "सुनीता देवी", mobile: "9893322411", itemName: "कीबोर्ड + माउस", qty: 1, rate: 550, discount: 0, amount: 550, paymentMode: "UPI", status: "Paid", soldAt: dayAgo(3) },
    ]);
  }

  const purchaseCount = await db.select({ value: count() }).from(purchases);
  if (Number(purchaseCount[0]?.value ?? 0) === 0) {
    await db.insert(purchases).values([
      { supplier: "इंदौर कंप्यूटर मार्केट", billNo: "PUR-501", itemName: "SSD 256GB × 6", qty: 6, rate: 1600, amount: 9600, paymentMode: "Bank Transfer", purchasedAt: dayAgo(8) },
      { supplier: "जबलपुर इन्फोटेक", billNo: "PUR-502", itemName: "Epson 003 कार्ट्रिज × 4", qty: 4, rate: 550, amount: 2200, paymentMode: "Cash", purchasedAt: dayAgo(6) },
      { supplier: "भोपाल ट्रेडर्स", billNo: "PUR-503", itemName: "CCTV कैमरा × 4", qty: 4, rate: 1200, amount: 4800, paymentMode: "Credit", purchasedAt: dayAgo(4) },
    ]);
  }

  const creditCount = await db.select({ value: count() }).from(creditLedger);
  if (Number(creditCount[0]?.value ?? 0) === 0) {
    await db.insert(creditLedger).values([
      { customerName: "शेख इरफ़ान", mobile: "8269301456", totalAmount: 3200, paidAmount: 1000, note: "CCTV सामग्री बाकी", status: "Pending" },
      { customerName: "ज्योति चौरसिया", mobile: "7000123987", totalAmount: 900, paidAmount: 0, note: "प्रिंटिंग बिल", status: "Pending" },
      { customerName: "मोहन लाल यादव", mobile: "7776622190", totalAmount: 1500, paidAmount: 1500, note: "पूर्ण भुगतान", status: "Paid" },
    ]);
  }

  const bookingCount = await db.select({ value: count() }).from(bookings);
  if (Number(bookingCount[0]?.value ?? 0) === 0) {
    await db.insert(bookings).values([
      { refNo: "BK-3001", serviceName: "बिलिंग सॉफ्टवेयर सेटअप", customerName: "श्री बालाजी किराना स्टोर", mobile: "9425012345", details: "दुकान का बिलिंग सॉफ्टवेयर सेटअप करना है", quantity: "1 सिस्टम", fee: 1500, status: "In Progress", createdAt: dayAgo(2) },
      { refNo: "BK-3002", serviceName: "मासिक अकाउंटिंग डेटा एंट्री", customerName: "जय माता दी ट्रेडर्स", mobile: "9009977812", details: "प्रति माह बिल एंट्री", quantity: "150 बिल", fee: 999, status: "New Request", createdAt: dayAgo(1) },
      { refNo: "BK-3003", serviceName: "Excel अकाउंटिंग शीट", customerName: "प्रीति ब्यूटी पार्लर", mobile: "8817766543", details: "खर्च व आय शीट बनानी है", quantity: "1 शीट", fee: 800, status: "Completed", createdAt: dayAgo(6) },
    ]);
  }

  const offerCount = await db.select({ value: count() }).from(offers);
  if (Number(offerCount[0]?.value ?? 0) === 0) {
    await db.insert(offers).values([
      {
        title: "प्रिंटिंग पर विशेष छूट — ₹2 से ₹1.50 प्रति पेज",
        detail: "आज ही 100 पेज से अधिक प्रिंट पर विशेष छूट। स्टूडेंट्स के लिए अतिरिक्त 10% छूट।",
        discount: "25% तक",
        startDate: dayAgo(1),
        endDate: new Date(Date.now() + 6 * 86_400_000),
        linkUrl: "/category/printing",
        active: true,
      },
      {
        title: "कंप्यूटर रिपेयर पर ₹100 की छूट",
        detail: "लैपटॉप/डेस्कटॉप रिपेयर पर ₹100 की तुरंत छूट — AMC ग्राहकों के लिए 15% अतिरिक्त।",
        discount: "₹100 छूट",
        startDate: dayAgo(3),
        endDate: new Date(Date.now() + 12 * 86_400_000),
        linkUrl: "/category/hardware",
        active: true,
      },
      {
        title: "नए ग्राहक के लिए पहली सेवा मुफ्त सहायता",
        detail: "पहली बार आने वाले ग्राहक को एक सरकारी फॉर्म भरने की सहायता निःशुल्क।",
        discount: "फ्री सहायता",
        startDate: dayAgo(5),
        endDate: new Date(Date.now() + 20 * 86_400_000),
        linkUrl: "/services",
        active: true,
      },
    ]);
  }

  const feedbackCount = await db.select({ value: count() }).from(feedback);
  if (Number(feedbackCount[0]?.value ?? 0) === 0) {
    await db.insert(feedback).values([
      { name: "रामकिशोर पटेल", mobile: "9425012345", rating: 5, comment: "आधार अपडेट का काम समय पर हो गया, व्यवहार बहुत अच्छा।", reply: "धन्यवाद! आपकी सेवा में हमें खुशी है।", serviceName: "आधार अपडेट सहायता", createdAt: dayAgo(3) },
      { name: "सुनीता देवी", mobile: "9893322411", rating: 5, comment: "आय प्रमाण पत्र जल्दी बन गया।", serviceName: "आय प्रमाण पत्र", createdAt: dayAgo(4) },
      { name: "अजय सिंह राजपूत", mobile: "9009977812", rating: 4, comment: "लैपटॉप रिपेयर अच्छा हुआ, थोड़ा समय लगा।", reply: "अगली बार समय कम लगेगा, क्षमा करें।", serviceName: "लैपटॉप रिपेयर", createdAt: dayAgo(6) },
      { name: "प्रीति तिवारी", mobile: "8817766543", rating: 5, comment: "प्रिंटिंग की दरें बहुत किफायती हैं।", serviceName: "B&W प्रिंट", createdAt: dayAgo(8) },
      { name: "शेख इरफ़ान", mobile: "8269301456", rating: 4, comment: "CCTV इंस्टॉलेशन अच्छे से हुआ।", serviceName: "CCTV इंस्टॉलेशन", createdAt: dayAgo(10) },
    ]);
  }

  const eventCount = await db.select({ value: count() }).from(profileEvents);
  if (Number(eventCount[0]?.value ?? 0) === 0) {
    const kinds = ["view", "call", "whatsapp", "direction"];
    const labels = ["कंप्यूटर रिपेयर अमानगंज", "आधार अपडेट पन्ना", "प्रिंटिंग दुकान अमानगंज", "डिजिटल सेवा केंद्र", "CCTV इंस्टॉलेशन पन्ना"];
    const rows: (typeof profileEvents.$inferInsert)[] = [];
    for (let i = 0; i < 90; i += 1) {
      rows.push({
        kind: kinds[i % kinds.length],
        label: labels[i % labels.length],
        source: i % 4 === 0 ? "whatsapp" : "app",
        createdAt: dayAgo(i % 20, i % 12),
      });
    }
    await db.insert(profileEvents).values(rows);
  }

  // ---- Bills with multiple items ----
  const billCount = await db.select({ value: count() }).from(bills);
  if (Number(billCount[0]?.value ?? 0) === 0) {
    const sampleBills = [
      {
        billNo: "BILL-1001", customerName: "अजय सिंह राजपूत", mobile: "9009977812", address: "ग्राम हिनौता, पन्ना",
        staffName: "Dheerendra", paymentMode: "UPI", status: "Paid", amountPaid: 4650, discount: 100, tax: 0,
        items: [
          { name: "SSD 256GB", sku: "SSD-256", description: "SATA SSD", qty: 1, price: 2100, discount: 0, tax: 0 },
          { name: "RAM 8GB DDR4", sku: "RAM-8GB", description: "डेस्कटॉप RAM", qty: 1, price: 1700, discount: 0, tax: 0 },
          { name: "विंडोज़ इंस्टॉलेशन सेवा", sku: "SVC-WIN", description: "OS + ड्राइवर", qty: 1, price: 900, discount: 0, tax: 0 },
        ],
        createdAt: dayAgo(1),
      },
      {
        billNo: "BILL-1002", customerName: "रामकिशोर पटेल", mobile: "9425012345", address: "ग्राम अमरपुर, अमानगंज",
        staffName: "operator", paymentMode: "Cash", status: "Unpaid", amountPaid: 0, discount: 0, tax: 0,
        items: [
          { name: "B&W प्रिंट (20 पेज)", sku: "PR-BW", description: "₹2 प्रति पेज", qty: 20, price: 2, discount: 0, tax: 0 },
          { name: "आधार अपडेट सहायता", sku: "GOV-ADH", description: "दुकान सेवा शुल्क", qty: 1, price: 100, discount: 0, tax: 0 },
        ],
        createdAt: dayAgo(0, 5),
      },
      {
        billNo: "BILL-1003", customerName: "शेख इरफ़ान", mobile: "8269301456", address: "पन्ना रोड, अमानगंज",
        staffName: "manager", paymentMode: "Credit", status: "Partially Paid", amountPaid: 1000, discount: 200, tax: 0,
        items: [
          { name: "CCTV कैमरा 2MP", sku: "CCTV-2MP", description: "इंस्टॉलेशन सहित", qty: 2, price: 1650, discount: 0, tax: 0 },
          { name: "DVR 4 चैनल", sku: "DVR-4CH", description: "रिकॉर्डर", qty: 1, price: 1400, discount: 0, tax: 0 },
        ],
        createdAt: dayAgo(3),
      },
    ].map((bill) => {
      const subtotal = bill.items.reduce((sum, item) => sum + item.qty * item.price - item.discount, 0);
      const grandTotal = subtotal - bill.discount + bill.tax;
      return { ...bill, subtotal, grandTotal, balanceDue: Math.max(0, grandTotal - bill.amountPaid) };
    });
    await db.insert(bills).values(sampleBills);
    await db.insert(payments).values([
      { billNo: "BILL-1001", customerName: "अजय सिंह राजपूत", amount: 4650, paymentMode: "UPI", reference: "UPI-889912", paidAt: dayAgo(1) },
      { billNo: "BILL-1003", customerName: "शेख इरफ़ान", amount: 1000, paymentMode: "Cash", reference: "रसीद 12", paidAt: dayAgo(2) },
    ]);
  }

  // ---- Service learning ----
  const learningCount = await db.select({ value: count() }).from(learnings);
  if (Number(learningCount[0]?.value ?? 0) === 0) {
    await db.insert(learnings).values([
      {
        serviceName: "आधार अपडेट सहायता", serviceSlug: "aadhaar-update-assistance",
        intro: "आधार में पता, मोबाइल व नाम सुधार के लिए UIDAI पोर्टल व दुकान के माध्यम से सहायता प्रक्रिया।",
        eligibility: "कोई भी आधार धारक (स्वयं उपस्थित या अधिकृत सहायता)।",
        documents: "आधार कार्ड, पते का प्रमाण, मोबाइल नंबर",
        officialUrl: "https://myaadhaar.uidai.gov.in/",
        steps: [
          { title: "ग्राहक सत्यापन", detail: "आधार व मोबाइल की पहचान तथा आवश्यक सुधार की पुष्टि करें।" },
          { title: "दस्तावेज़ जाँच", detail: "पते का वैध प्रमाण (बिजली बिल/राशन कार्ड) जाँचें।" },
          { title: "ऑनलाइन अनुरोध", detail: "myAadhaar पर अनुरोध दर्ज करें या केंद्र पर बायोमेट्रिक अपडेट कराएँ।" },
          { title: "URN नोट करें", detail: "अपडेट रिक्वेस्ट नंबर ग्राहक को दें और स्थिति ट्रैक करें।" },
          { title: "रसीद व डिलीवरी", detail: "काम पूरा होने पर रसीद प्रिंट करें व तैयार दस्तावेज़ अपलोड करें।" },
        ],
        mistakes: "पूरा आधार नंबर या OTP कहीं लिखकर न रखें; अधूरे पते के कारण अनुरोध अस्वीकृत हो सकता है।",
        videoUrl: "", notesUrl: "",
      },
      {
        serviceName: "MP पुलिस / आरक्षक भर्ती फॉर्म", serviceSlug: "mp-police-constable-recruitment-form",
        intro: "MP ESB पोर्टल पर आरक्षक भर्ती के ऑनलाइन फॉर्म, फोटो-हस्ताक्षर व शुल्क भुगतान सहायता।",
        eligibility: "विज्ञापन के अनुसार 10वीं/12वीं योग्यता व आयु सीमा।",
        documents: "10वीं/12वीं मार्कशीट, आधार, फोटो, हस्ताक्षर, निवास प्रमाण",
        officialUrl: "https://esb.mp.gov.in/",
        steps: [
          { title: "विज्ञापन पढ़ें", detail: "पात्रता, आयु व शुल्क की पुष्टि आधिकारिक विज्ञापन से करें।" },
          { title: "पंजीकरण", detail: "ESB पोर्टल पर नया पंजीकरण करें और OTP मोबाइल पर ग्राहक स्वयं डाले।" },
          { title: "फोटो व हस्ताक्षर", detail: "निर्धारित साइज में फोटो व हस्ताक्षर अपलोड करें (हम रीसाइज़ में सहायता करते हैं)।" },
          { title: "शुल्क भुगतान", detail: "ऑनलाइन शुल्क ग्राहक के UPI/कार्ड से भरें; सफलता की पुष्टि पोर्टल से देखें।" },
          { title: "फॉर्म प्रिंट", detail: "अंतिम फॉर्म व रसीद प्रिंट करके सुरक्षित रखें, भविष्य के लिए ट्रैक करें।" },
        ],
        mistakes: "गलत फोटो साइज, अंतिम तिथि छूटना व गलत जाति/श्रेणी चयन सबसे आम गलतियाँ हैं।",
      },
      {
        serviceName: "रेल टिकट बुकिंग सहायता", serviceSlug: "train-ticket-booking-assistance",
        intro: "IRCTC के माध्यम से टिकट बुकिंग सहायता, PNR व सीट उपलब्धता जाँच।",
        eligibility: "मान्य पहचान पत्र रखने वाला कोई भी यात्री।",
        documents: "आधार या अन्य स्वीकृत फोटो पहचान, यात्री विवरण",
        officialUrl: "https://www.irctc.co.in/",
        steps: [
          { title: "मार्ग व तारीख", detail: "प्रस्थान/गंतव्य स्टेशन, तारीख व यात्री संख्या दर्ज करें।" },
          { title: "उपलब्धता देखें", detail: "IRCTC पर सीट उपलब्धता व किराया दिखाएँ — किराया ग्राहक को पारदर्शी रूप से बताएँ।" },
          { title: "बुकिंग व भुगतान", detail: "ग्राहक की सहमति व भुगतान के बाद ही टिकट बुक करें।" },
          { title: "PNR साझा करें", detail: "बुकिंग के बाद PNR व टिकट PDF ग्राहक को दें।" },
        ],
        mistakes: "यात्रा तिथि/बोर्डिंग स्टेशन गलत चुनना; तत्काल में समय का ध्यान न रखना।",
      },
    ]);
  }

  // ---- Business profiles ----
  const profileCount = await db.select({ value: count() }).from(businessProfiles);
  if (Number(profileCount[0]?.value ?? 0) === 0) {
    await db.insert(businessProfiles).values([
      {
        slug: "dp-digital-seva-kendra", name: "Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra",
        category: "कंप्यूटर व डिजिटल सेवा", ownerName: "Dheerendra Prajapati",
        phone: "7610420959", whatsapp: "917610420959", email: "dheerendr9522@gmail.com",
        address: "बाज़ार मोहल्ला, अमानगंज, पन्ना, मध्य प्रदेश – 488441",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bajar+Mohalla+Amanganj+Panna+Madhya+Pradesh+488441",
        description: "डिजिटल सेवा केंद्र, कंप्यूटर हार्डवेयर/सॉफ्टवेयर रिपेयर, प्रिंटिंग, बिलिंग व सरकारी ऑनलाइन सहायता।",
        servicesText: "आधार/पैन/वोटर सहायता, प्रमाण पत्र, बिल भुगतान, रेल टिकट, कंप्यूटर रिपेयर, CCTV, प्रिंटिंग, बिलिंग सॉफ्टवेयर",
        workingHours: "सोमवार – शनिवार, 9:30 AM – 8:00 PM", views: 128,
      },
      {
        slug: "dp-computer-training", name: "DP Computer Training Center",
        category: "कंप्यूटर शिक्षा एवं ट्रेनिंग", ownerName: "Dheerendra Prajapati",
        phone: "8962680352", whatsapp: "918962680352", email: "dheerendr9522@gmail.com",
        address: "बाज़ार मोहल्ला, अमानगंज, पन्ना (M.P.)",
        description: "बेसिक कंप्यूटर, MS Office, हिंदी/अंग्रेज़ी टाइपिंग व डिजिटल साक्षरता प्रशिक्षण।",
        servicesText: "बेसिक कंप्यूटर कोर्स, MS Office, टाइपिंग, इंटरनेट ट्रेनिंग, सर्टिफिकेट",
        workingHours: "सोमवार – शनिवार, 10:00 AM – 6:00 PM", views: 47,
      },
    ]);
  }

  // ---- Inquiries ----
  const inquiryCount = await db.select({ value: count() }).from(inquiries);
  if (Number(inquiryCount[0]?.value ?? 0) === 0) {
    await db.insert(inquiries).values([
      { profileSlug: "dp-digital-seva-kendra", name: "राहुल यादव", mobile: "9425012345", message: "लैपटॉप रिपेयर का खर्च पूछना है।", status: "New", createdAt: dayAgo(1) },
      { profileSlug: "dp-computer-training", name: "नेहा सोनी", mobile: "9876543210", message: "बेसिक कंप्यूटर कोर्स की फीस व समय?", status: "Replied", createdAt: dayAgo(3) },
    ]);
  }

  // ---- Banners ----
  const bannerCount = await db.select({ value: count() }).from(banners);
  if (Number(bannerCount[0]?.value ?? 0) === 0) {
    await db.insert(banners).values([
      {
        title: "🎉 नए ग्राहकों के लिए पहली सेवा पर विशेष छूट",
        subtitle: "आधार अपडेट, पैन कार्ड व प्रमाण पत्र सहायता — तेज़ व भरोसेमंद सेवा",
        imageUrl: "", buttonLabel: "सभी सेवाएँ देखें", buttonLink: "/services",
        targetPage: "home", position: "below-header", displayType: "hero",
        bgColor: "#4338ca", textColor: "#ffffff", overlayOpacity: 45, radius: 18,
        startDate: dayAgo(3), endDate: new Date(Date.now() + 30 * 86_400_000), displayOrder: 1, status: "Active", active: true,
      },
      {
        title: "🖨️ प्रिंटिंग पर ₹1.50/पेज — 100 पेज से अधिक पर",
        subtitle: "स्टूडेंट्स के लिए अतिरिक्त छूट · फोटोकॉपी · लेमिनेशन",
        buttonLabel: "ऑफर देखें", buttonLink: "/offers",
        targetPage: "services", position: "above-heading", displayType: "promotional",
        bgColor: "#c2410c", textColor: "#ffffff", overlayOpacity: 30, radius: 14,
        startDate: dayAgo(1), endDate: new Date(Date.now() + 20 * 86_400_000), displayOrder: 2, status: "Active", active: true,
      },
    ]);
  }

  // ---- Integrations ----
  const integrationCount = await db.select({ value: count() }).from(integrations);
  if (Number(integrationCount[0]?.value ?? 0) === 0) {
    await db.insert(integrations).values([
      { name: "DP Digital Seva App", type: "app", url: "https://3000-i0lyafx5ewjpsju30llze.e2b.app", description: "मुख्य फुल-स्टैक ऐप", relatedService: "सभी सेवाएँ", loginType: "Staff + Customer", dbType: "PostgreSQL (Drizzle)" },
      { name: "DP Business Profile (public)", type: "website", url: "/business/dp-digital-seva-kendra", description: "सार्वजनिक बिज़नेस प्रोफाइल पेज", relatedService: "बिज़नेस प्रोफाइल", loginType: "Public", dbType: "PostgreSQL" },
      { name: "Google Sheet Data Archive", type: "sheet", url: "https://sheets.new", description: "ग्राहक/आवेदन/बिल डेटा संग्रह", relatedService: "रिपोर्टिंग", loginType: "Service Account", dbType: "Google Sheets", sheetName: "Applications" },
    ] as never);
  }

  // ---- Design elements: custom menus, pages, cards, buttons ----
  const menuCount = await db.select({ value: count() }).from(customMenus);
  if (Number(menuCount[0]?.value ?? 0) === 0) {
    await db.insert(customMenus).values([
      { label: " डिजिटल सेवा गाइड", href: "/p/digital-seva-guide", icon: "📘", sortOrder: 10, visible: true },
      { label: "ऑफर एवं छूट", href: "/offers", icon: "🏷️", sortOrder: 20, visible: true },
      { label: "सेवा सीखें", href: "/learning", icon: "🎓", sortOrder: 30, visible: true },
      { label: "बिज़नेस प्रोफाइल", href: "/business", icon: "🏪", sortOrder: 40, visible: true },
      { label: "बिलिंग एवं अकाउंटिंग", href: "/accounting", icon: "🧮", sortOrder: 50, visible: true },
    ]);
  }

  const pageCount = await db.select({ value: count() }).from(customPages);
  if (Number(pageCount[0]?.value ?? 0) === 0) {
    await db.insert(customPages).values({
      slug: "digital-seva-guide",
      title: "डिजिटल सेवा गाइड",
      subtitle: "आधार, पैन, प्रमाण पत्र, बिल भुगतान व अन्य सेवाओं की पूरी जानकारी एक ही पेज पर।",
      published: true,
      sections: [
        { type: "section", title: "🆔 पहचान सेवाएँ", text: "आधार अपडेट सहायता, पैन कार्ड नया/सुधार, मतदाता आईडी व डिजिलॉकर दस्तावेज़ — आवश्यक दस्तावेज़ साथ लाएँ।", buttonLabel: "सेवाएँ देखें", buttonHref: "/category/government" },
        { type: "section", title: "🧾 प्रमाण पत्र", text: "आय, जाति, निवास, जन्म व मृत्यु प्रमाण पत्र — MP e-District से आवेदन, अनुमानित समय 7–21 दिन।", buttonLabel: "e-District पोर्टल", buttonHref: "https://mpedistrict.gov.in/" },
        { type: "section", title: "💳 बिल व रिचार्ज", text: "बिजली, पानी, गैस, DTH, मोबाइल व FASTag — BBPS से भुगतान, ₹10 दुकान सुविधा शुल्क।", buttonLabel: "बिल भुगतान", buttonHref: "/category/bills" },
        { type: "section", title: "🚆 रेल टिकट सहायता", text: "IRCTC के माध्यम से बुकिंग सहायता, PNR व सीट उपलब्धता जाँच। किराया अलग देय है।", buttonLabel: "रेल सेवा", buttonHref: "/train" },
      ],
    });
  }

  const cardCount = await db.select({ value: count() }).from(customCards);
  if (Number(cardCount[0]?.value ?? 0) === 0) {
    await db.insert(customCards).values([
      { title: "आज का विशेष ऑफर", subtitle: "प्रिंटिंग ₹1.50/पेज · स्टूडेंट्स के लिए अतिरिक्त छूट", icon: "🏷️", href: "/offers", bgColor: "#fff7ed", textColor: "#7c2d12", sortOrder: 10, surface: "home" },
      { title: "लेटेस्ट रेट लिस्ट", subtitle: "सभी 450+ सेवाओं के अपडेटेड शुल्क देखें", icon: "📋", href: "/services", bgColor: "#eef2ff", textColor: "#312e81", sortOrder: 20, surface: "home" },
      { title: "फ्री बिज़नेस प्रोफाइल", subtitle: "अपनी दुकान का ऑनलाइन बिज़नेस प्रोफाइल बनवाएँ — Google पर दिखें", icon: "🏪", href: "/business", bgColor: "#ecfdf5", textColor: "#065f46", sortOrder: 30, surface: "home" },
      { title: "सीखें व कमाएँ", subtitle: "कंप्यूटर कोर्स, टाइपिंग व बिलिंग सॉफ्टवेयर ट्रेनिंग", icon: "🎓", href: "/learning", bgColor: "#fef3c7", textColor: "#78350f", sortOrder: 40, surface: "home" },
    ]);
  }

  const buttonCount = await db.select({ value: count() }).from(customButtons);
  if (Number(buttonCount[0]?.value ?? 0) === 0) {
    await db.insert(customButtons).values([
      { label: "सभी सेवाएँ", icon: "🧾", href: "/services", bgColor: "#4f46e5", textColor: "#ffffff", sortOrder: 10, surface: "home" },
      { label: "आवेदन ट्रैक करें", icon: "📍", href: "/track", bgColor: "#0ea5e9", textColor: "#ffffff", sortOrder: 20, surface: "home" },
      { label: "UPI भुगतान", icon: "💳", href: "/pay", bgColor: "#059669", textColor: "#ffffff", sortOrder: 30, surface: "home" },
      { label: "ऑफर देखें", icon: "🏷️", href: "/offers", bgColor: "#ea580c", textColor: "#ffffff", sortOrder: 40, surface: "home" },
      { label: "बिलिंग सहायता", icon: "🧮", href: "/accounting", bgColor: "#7c3aed", textColor: "#ffffff", sortOrder: 50, surface: "home" },
    ]);
  }

  // Guarantee: no duplicate service names (keeps the oldest row, repoints applications).
  await db.execute(sql`
    UPDATE applications a SET service_id = (SELECT id FROM services s WHERE lower(trim(s.name_hi)) = lower(trim(a.service_name)) ORDER BY id LIMIT 1)
    WHERE a.service_id IS NOT NULL
  `).catch(() => undefined);
  await db.execute(sql`
    DELETE FROM services s USING services t
    WHERE lower(trim(s.name_hi)) = lower(trim(t.name_hi)) AND s.id > t.id
  `).catch(() => undefined);

  const finalServiceCount = await db.select({ value: count() }).from(services);
  return { seeded: true, services: Number(finalServiceCount[0]?.value ?? 0) };
}

let seedPromise: Promise<{ seeded: boolean; services: number }> | null = null;

export async function ensureSeeded(): Promise<{ seeded: boolean; services: number }> {
  if (!seedPromise) {
    seedPromise = seedDatabase().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

export async function getCounts() {
  const [s, c, w] = await Promise.all([
    db.select({ value: count() }).from(services),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(websites),
  ]);
  return {
    services: Number(s[0]?.value ?? 0),
    categories: Number(c[0]?.value ?? 0),
    websites: Number(w[0]?.value ?? 0),
  };
}

export async function categoryServiceCounts() {
  return db
    .select({ categoryId: services.categoryId, total: count() })
    .from(services)
    .where(eq(services.active, true))
    .groupBy(services.categoryId);
}


