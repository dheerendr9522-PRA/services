import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("operator"),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    loginCount: integer("login_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_uq").on(t.username)],
);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address").default(""),
  email: text("email").default(""),
  village: text("village").default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    nameHi: text("name_hi").notNull(),
    nameEn: text("name_en").notNull(),
    icon: text("icon").notNull().default("📁"),
    groupKey: text("group_key").notNull().default("digital"),
    description: text("description").default(""),
    sortOrder: integer("sort_order").notNull().default(100),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    categoryId: integer("category_id").notNull(),
    nameHi: text("name_hi").notNull(),
    nameEn: text("name_en").notNull(),
    description: text("description").default(""),
    documents: jsonb("documents").$type<string[]>().notNull().default([]),
    shopFee: integer("shop_fee").notNull().default(0),
    govtFee: integer("govt_fee").notNull().default(0),
    bookingFee: integer("booking_fee").notNull().default(0),
    feeStatus: text("fee_status").notNull().default("Owner-configured"),
    timeEstimate: text("time_estimate").notNull().default("1 दिन"),
    officialUrl: text("official_url").default(""),
    serviceMode: text("service_mode").notNull().default("shop"),
    onlineModeNote: text("online_mode_note").default(""),
    formFields: jsonb("form_fields")
      .$type<{ key: string; label: string; type: string; required?: boolean; options?: string[] }[]>()
      .notNull()
      .default([]),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("services_slug_uq").on(t.slug)],
);

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mime: text("mime").notNull().default("application/octet-stream"),
  size: integer("size").notNull().default(0),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    refNo: text("ref_no").notNull(),
    serviceId: integer("service_id"),
    serviceSlug: text("service_slug").default(""),
    serviceName: text("service_name").notNull(),
    customerName: text("customer_name").notNull(),
    mobile: text("mobile").notNull(),
    whatsapp: text("whatsapp").default(""),
    guardianName: text("guardian_name").default(""),
    address: text("address").default(""),
    email: text("email").default(""),
    familyId: text("family_id").default(""),
    notes: text("notes").default(""),
    formData: jsonb("form_data").$type<Record<string, string>>().notNull().default({}),
    relatedTasks: jsonb("related_tasks").$type<string[]>().notNull().default([]),
    servicesList: jsonb("services_list")
      .$type<{ slug: string; nameHi: string; fee: number; status: string; documents: string[] }[]>()
      .notNull()
      .default([]),
    amount: integer("amount").notNull().default(0),
    govtFee: integer("govt_fee").notNull().default(0),
    paymentMode: text("payment_mode").notNull().default("UPI"),
    utr: text("utr").default(""),
    status: text("status").notNull().default("Pending"),
    adminNote: text("admin_note").default(""),
    customerQuery: text("customer_query").default(""),
    serviceDate: timestamp("service_date", { withTimezone: true }),
    followUpDate: timestamp("follow_up_date", { withTimezone: true }),
    estCompletion: timestamp("est_completion", { withTimezone: true }),
    paidAmount: integer("paid_amount").notNull().default(0),
    paymentVerify: text("payment_verify").notNull().default("unpaid"),
    completedFileId: integer("completed_file_id"),
    completedFileName: text("completed_file_name").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("applications_ref_uq").on(t.refNo)],
);

export const applicationDocuments = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  docType: text("doc_type").notNull(),
  fileId: integer("file_id").notNull(),
  serviceSlug: text("service_slug").default(""),
  comment: text("comment").default(""),
  uploadedBy: text("uploaded_by").notNull().default("staff"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  section: text("section").notNull().default("mp"),
  groupLabel: text("group_label").default(""),
  note: text("note").default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(100),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  items: jsonb("items")
    .$type<{ label: string; qty: number; rate: number; discount?: number; tax?: number; description?: string; sku?: string }[]>()
    .notNull()
    .default([]),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  status: text("status").notNull().default("Paid"),
  notes: text("notes").default(""),
  dueDate: timestamp("due_date", { withTimezone: true }),
  amountPaid: integer("amount_paid").notNull().default(0),
  gstEnabled: boolean("gst_enabled").notNull().default(false),
  gstin: text("gstin").default(""),
  customerGstin: text("customer_gstin").default(""),
  gstType: text("gst_type").notNull().default("CGST_SGST"),
  gstRate: integer("gst_rate").notNull().default(18),
  gstAmount: integer("gst_amount").notNull().default(0),
  cgst: integer("cgst").notNull().default(0),
  sgst: integer("sgst").notNull().default(0),
  igst: integer("igst").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repairs = pgTable("repairs", {
  id: serial("id").primaryKey(),
  jobNo: text("job_no").notNull(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  device: text("device").notNull(),
  issue: text("issue").notNull(),
  technician: text("technician").default(""),
  estimate: integer("estimate").notNull().default(0),
  finalAmount: integer("final_amount").notNull().default(0),
  status: text("status").notNull().default("Pending"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("अन्य"),
  amount: integer("amount").notNull().default(0),
  paidTo: text("paid_to").default(""),
  note: text("note").default(""),
  spentAt: timestamp("spent_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").default(""),
  category: text("category").default("कंप्यूटर पार्ट्स"),
  buyPrice: integer("buy_price").notNull().default(0),
  sellPrice: integer("sell_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(2),
  imageUrl: text("image_url").default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  billNo: text("bill_no").notNull().default(""),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").default(""),
  itemName: text("item_name").notNull().default(""),
  qty: integer("qty").notNull().default(1),
  rate: integer("rate").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  status: text("status").notNull().default("Paid"),
  note: text("note").default(""),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplier: text("supplier").notNull(),
  billNo: text("bill_no").default(""),
  itemName: text("item_name").notNull().default(""),
  qty: integer("qty").notNull().default(1),
  rate: integer("rate").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  note: text("note").default(""),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").default(""),
  totalAmount: integer("total_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  note: text("note").default(""),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  refNo: text("ref_no").notNull().default(""),
  serviceName: text("service_name").notNull(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  details: text("details").default(""),
  quantity: text("quantity").default(""),
  fee: integer("fee").notNull().default(0),
  status: text("status").notNull().default("New Request"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  detail: text("detail").default(""),
  discount: text("discount").default(""),
  offerType: text("offer_type").notNull().default("simple"),
  buyQty: integer("buy_qty").notNull().default(0),
  getQty: integer("get_qty").notNull().default(0),
  freeItem: text("free_item").default(""),
  comboItems: text("combo_items").default(""),
  relatedService: text("related_service").default(""),
  terms: text("terms").default(""),
  imageUrl: text("image_url").default(""),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull().defaultNow(),
  linkUrl: text("link_url").default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").default(""),
  rating: integer("rating").notNull().default(5),
  comment: text("comment").default(""),
  reply: text("reply").default(""),
  serviceName: text("service_name").default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileEvents = pgTable("profile_events", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("view"),
  label: text("label").default(""),
  source: text("source").default("app"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNo: text("bill_no").notNull(),
  billDate: timestamp("bill_date", { withTimezone: true }).notNull().defaultNow(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").default(""),
  address: text("address").default(""),
  email: text("email").default(""),
  staffName: text("staff_name").default(""),
  items: jsonb("items")
    .$type<{ name: string; sku: string; description: string; qty: number; price: number; discount: number; tax: number }[]>()
    .notNull()
    .default([]),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  gstEnabled: boolean("gst_enabled").notNull().default(false),
  gstin: text("gstin").default(""),
  sellerGstin: text("seller_gstin").default(""),
  customerGstin: text("customer_gstin").default(""),
  gstType: text("gst_type").notNull().default("CGST_SGST"),
  gstRate: integer("gst_rate").notNull().default(18),
  cgst: integer("cgst").notNull().default(0),
  sgst: integer("sgst").notNull().default(0),
  igst: integer("igst").notNull().default(0),
  gstAmount: integer("gst_amount").notNull().default(0),
  grandTotal: integer("grand_total").notNull().default(0),
  amountPaid: integer("amount_paid").notNull().default(0),
  balanceDue: integer("balance_due").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  status: text("status").notNull().default("Unpaid"),
  notes: text("notes").default(""),
  isDraft: boolean("is_draft").notNull().default(false),
  offlineKey: text("offline_key").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  billNo: text("bill_no").notNull().default(""),
  customerName: text("customer_name").notNull().default(""),
  amount: integer("amount").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  reference: text("reference").default(""),
  note: text("note").default(""),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learnings = pgTable("learnings", {
  id: serial("id").primaryKey(),
  serviceName: text("service_name").notNull(),
  serviceSlug: text("service_slug").default(""),
  intro: text("intro").default(""),
  eligibility: text("eligibility").default(""),
  documents: text("documents").default(""),
  officialUrl: text("official_url").default(""),
  steps: jsonb("steps").$type<{ title: string; detail: string }[]>().notNull().default([]),
  mistakes: text("mistakes").default(""),
  videoUrl: text("video_url").default(""),
  notesUrl: text("notes_url").default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: text("category").default("कंप्यूटर व डिजिटल सेवा"),
  ownerName: text("owner_name").default(""),
  phone: text("phone").default(""),
  whatsapp: text("whatsapp").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  mapsUrl: text("maps_url").default(""),
  description: text("description").default(""),
  servicesText: text("services_text").default(""),
  workingHours: text("working_hours").default(""),
  logoUrl: text("logo_url").default(""),
  coverUrl: text("cover_url").default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  websiteUrl: text("website_url").default(""),
  published: boolean("published").notNull().default(true),
  ownerMobile: text("owner_mobile").default(""),
  template: text("template").notNull().default("classic"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  accentColor: text("accent_color").notNull().default("#f97316"),
  layout: text("layout").notNull().default("hero"),
  productsText: text("products_text").default(""),
  socialLinks: text("social_links").default(""),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  profileSlug: text("profile_slug").default(""),
  name: text("name").notNull(),
  mobile: text("mobile").default(""),
  message: text("message").default(""),
  status: text("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  mobileImageUrl: text("mobile_image_url").default(""),
  buttonLabel: text("button_label").default(""),
  buttonLink: text("button_link").default(""),
  secondaryLabel: text("secondary_label").default(""),
  secondaryLink: text("secondary_link").default(""),
  targetPage: text("target_page").notNull().default("home"),
  position: text("position").notNull().default("below-header"),
  displayType: text("display_type").notNull().default("promotional"),
  bgColor: text("bg_color").default("#4f46e5"),
  textColor: text("text_color").default("#ffffff"),
  overlayOpacity: integer("overlay_opacity").notNull().default(40),
  radius: integer("radius").notNull().default(16),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull().defaultNow(),
  displayOrder: integer("display_order").notNull().default(10),
  status: text("status").notNull().default("Active"),
  active: boolean("active").notNull().default(true),
  altText: text("alt_text").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const designVersions = pgTable("design_versions", {
  id: serial("id").primaryKey(),
  versionNo: integer("version_no").notNull().default(1),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  changedBy: text("changed_by").default(""),
  note: text("note").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("website"),
  url: text("url").default(""),
  description: text("description").default(""),
  logoUrl: text("logo_url").default(""),
  relatedService: text("related_service").default(""),
  loginType: text("access_type").default("Public"),
  dbType: text("db_type").default("—"),
  sheetId: text("sheet_id").default(""),
  sheetName: text("sheet_name").default(""),
  webhookUrl: text("webhook_url").default(""),
  status: text("status").notNull().default("Active"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  entity: text("entity").notNull().default(""),
  offlineKey: text("offline_key").default(""),
  status: text("status").notNull().default("synced"),
  message: text("message").default(""),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  device: text("device").default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customMenus = pgTable("custom_menus", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  href: text("href").notNull().default("/"),
  icon: text("icon").default("🔗"),
  parent: text("parent").default(""),
  sortOrder: integer("sort_order").notNull().default(100),
  openNewTab: boolean("open_new_tab").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  roles: text("roles").notNull().default("all"),
});

export const customPages = pgTable("custom_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  sections: jsonb("sections")
    .$type<{ type: string; title: string; text: string; imageUrl?: string; buttonLabel?: string; buttonHref?: string; bgColor?: string }[]>()
    .notNull()
    .default([]),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customCards = pgTable("custom_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  icon: text("icon").default("✨"),
  imageUrl: text("image_url").default(""),
  bgColor: text("bg_color").default("#eef2ff"),
  textColor: text("text_color").default("#1e293b"),
  radius: integer("radius").notNull().default(16),
  href: text("href").default("/services"),
  surface: text("surface").notNull().default("home"),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(10),
});

export const customButtons = pgTable("custom_buttons", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").default(""),
  href: text("href").default("/services"),
  action: text("action").notNull().default("link"),
  bgColor: text("bg_color").default("#4f46e5"),
  textColor: text("text_color").default("#ffffff"),
  style: text("style").notNull().default("rounded"),
  surface: text("surface").notNull().default("home"),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(10),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  audience: text("audience").notNull().default("all"),
  title: text("title").notNull(),
  body: text("body").default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  detail: text("detail").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Service = typeof services.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Repair = typeof repairs.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Learning = typeof learnings.$inferSelect;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
