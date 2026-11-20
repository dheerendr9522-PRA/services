import { db } from "@/db";
import { settings } from "@/db/schema";

export type SettingsMap = Record<string, string>;

export const defaultSettings: SettingsMap = {
  businessName: "Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra",
  tagline: "आपकी डिजिटल सेवाएँ, एक ही जगह।",
  ownerName: "Dheerendra Prajapati",
  phonePrimary: "7610420959",
  phoneSecondary: "8962680352",
  email: "dp8109@gmail.com",
  emailSecondary: "dheerendr9522@gmail.com",
  address: "Bajar Mohalla, Amanganj, Panna, M.P. – 488441",
  upiName: "Dheerendra Prajapati",
  upiId: "dheerendr9522@upi",
  upiMobile: "7610420959",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Bajar+Mohalla+Amanganj+Panna+Madhya+Pradesh+488441",
  groupDigital: "1",
  groupShop: "1",
  groupAccount: "1",
  groupAdmin: "1",
  adminLoginEnabled: "1",
  loginPageVisible: "1",
  showCredentials: "1",
  displayLoginId: "dheerendra",
  displayLoginPassword: "Dheeru@2026",
  ownerUnlockKey: "DP-OWNER-2026",
  customerPin: "1234",
  bannerEnabled: "1",
  bannerText: "",
  bannerSpeed: "28",
  brandColor: "#4f46e5",
  accentColor: "#f97316",
  upiEnabled: "1",
  mobileUpiEnabled: "1",
  businessHours: "सोमवार – शनिवार, 9:30 AM – 8:00 PM",
  gmbLink: "https://www.google.com/search?q=Dheerendra+Prajapati+Computer+Hardware+Software+Digital+Seva+Kendra+Amanganj+Panna",
  pushEnabled: "1",
  offersEnabled: "1",
  feedbackEnabled: "1",
  designJson: "",
  billFooter: "धन्यवाद! यह बिल Dheerendra Prajapati Digital Seva Kendra द्वारा जारी किया गया।",
  dateFormat: "DD/MM/YYYY",
  language: "hi",
  allowedFileTypes: "PDF,DOC,DOCX,XLS,XLSX,PPT,PPTX,JPG,JPEG,PNG,WEBP",
  maxFileSizeMb: "100",
  refundPolicy: "सरकारी शुल्क वापस नहीं होता; दुकान सेवा शुल्क अस्वीकृति पर नियमानुसार।",
  logoUrl: "",
  profileUrl: "",
  heroNote: "230+ सेवाएँ • सरकारी पोर्टल • कंप्यूटर रिपेयर • बिलिंग",
};

export async function getSettings(): Promise<SettingsMap> {
  try {
    const rows = await db.select().from(settings);
    const map: SettingsMap = { ...defaultSettings };
    for (const row of rows) {
      if (row.value !== null && row.value !== undefined && row.value !== "") {
        map[row.key] = row.value;
      } else if (!(row.key in map)) {
        map[row.key] = row.value ?? "";
      }
    }
    return map;
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettings(updates: SettingsMap): Promise<void> {
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value: String(value ?? "") })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value ?? "") } });
  }
}
