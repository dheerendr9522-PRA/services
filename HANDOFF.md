# 📘 DP Digital Seva Kendra — पूरा प्रोजेक्ट हैंडऑफ़ (नई चैट के लिए)

> यह फ़ाइल प्रोजेक्ट का पूरा सार है। नई चैट में इसे (या niche `## 12` वाला Master Prompt) पेस्ट करके काम आगे बढ़ाया जा सकता है।

## 1. लाइव लिंक (Preview)
**https://3000-iabrxhsuhtbidxkso3gbp.e2b.app**

> ⚠️ यह प्लेटफ़ॉर्म का अस्थायी preview सैंडबॉक्स है — सत्र बंद होने/समय बीतने पर बदल सकता है। स्थायी लिंक के लिए `## 11` की डिप्लॉयमेंट प्रक्रिया (Vercel + Neon) अपनाएँ।

## 2. लॉगिन क्रेडेंशियल
| भूमिका | ID / मोबाइल | पासवर्ड / पिन |
|---|---|---|
| Owner (मुख्य एडमिन) | `dheerendra` | `Dheeru@2026` |
| Manager | `manager` | `Manager@2026` |
| Operator | `operator` | `Shop@2026` |
| ग्राहक (कोई भी 10 अंक) | `9425012345` | `1234` |
| डेमो ट्रैकिंग | `DP-R2001` | मोबाइल `9425012345` |
| Owner Access Key (लॉगिन पेज छिपा हो) | — | `DP-OWNER-2026` |

## 3. व्यवसाय / ब्रांडिंग (सेटिंग्स से एडिट करने योग्य)
- नाम: Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra
- टैगलाइन: “आपकी डिजिटल सेवाएँ, एक ही जगह।”
- फोन: 7610420959 · 8962680352 · ईमेल: dp8109@gmail.com (सेकंडरी: dheerendr9522@gmail.com)
- पता: Bajar Mohalla, Amanganj, Panna (M.P.) 488441
- UPI: dheerendr9522@upi · UPI मोबाइल: 7610420959

## 4. Tech Stack
- Next.js 16 (App Router, TypeScript, Turbopack) + React 19 + Tailwind CSS 4
- PostgreSQL + Drizzle ORM (`src/db/schema.ts`), seed engine `src/db/seed.ts`
- Auth: कस्टम scrypt पासवर्ड हैश + HMAC-signed HttpOnly cookies (staff व customer अलग)
- फ़ाइलें: DB-आधारित सुरक्षित स्टोरेज (`files` table, Base64) — 5 KB से 100 MB/फाइल
- PWA: `public/manifest.webmanifest`, `public/sw.js`, offline fallback, install prompt
- QR: `qrcode` (सर्वर-साइड UPI QR), ZIP: `jszip`

## 5. डेटाबेस (35 tables)
`users, customers, categories, services, files, applications, application_documents, websites,
invoices, repairs, expenses, products, sales, purchases, credit_ledger, bookings, offers, feedback,
profile_events, bills, payments, learnings, business_profiles, inquiries, banners, design_versions,
integrations, sync_logs, custom_menus, custom_pages, custom_cards, custom_buttons, notifications,
audit_logs, settings`

वर्तमान डेटा: 450 सेवाएँ · 25 मेन्यू · 150 वेबसाइट · 6 आवेदन · 4 बिल · 7 इनवॉइस · 10 ग्राहक ·
6 खर्च · 6 रिपेयर · 8 उत्पाद · 3 ऑफर · 5 रेटिंग · 2 बिज़नेस प्रोफाइल · 2 बैनर · 3 ट्रेनिंग ·
1 कस्टम पेज · 5 कस्टम मेन्यू · 4 कार्ड · 5 बटन · 3 स्टाफ · डुप्लीकेट = 0

## 6. पेज / रूट्स
**पब्लिक:** `/` होम · `/services` · `/category/[slug]` · `/service/[slug]` (सेवा विवरण + एकल फॉर्म + मास्टर/मल्टी-सेवा आवेदन + दस्तावेज़ + UPI) · `/train` · `/pay` · `/track` · `/directory` · `/search` · `/contact` · `/offers` · `/business` · `/business/[slug]` · `/learning` · `/learning/[id]` · `/accounting` · `/apps` · `/apps/view` (in-app iframe) · `/p/[slug]` (कस्टम पेज) · `/privacy` · `/terms` · `/login` · `/customer/login`

**कस्टमर:** `/customer` — Customer ID, 5 स्टेट कार्ड, टैब: मेरे आवेदन · रिपेयर जॉब · मेरे बिल · मेरे दस्तावेज़ (View/Edit/Replace/Delete/Download/Print) · तैयार दस्तावेज़ · रसीद प्रिंट · दस्तावेज़ भेजें (multi-upload + consent); `/customer/business` — अपना बिज़नेस प्रोफाइल बिल्डर

**एडमिन (30 पेज, टॉप प्रोफाइल कार्ड + पिल टैब + Back बटन):**
`/admin` अवलोकन · `/admin/applications` (+ `/[id]` पूरा Edit फॉर्म, फोल्डर ZIP, दस्तावेज़ दोबारा माँगें, तैयार दस्तावेज़ अपलोड) · `/admin/customers` · `/admin/repairs` (+ `/[id]` जॉब कार्ड) · `/admin/invoices` (+ `/[id]` प्रिंट) · `/admin/documents` · `/admin/services` · `/admin/websites` · `/admin/categories` · `/admin/menus` · `/admin/users` · `/admin/expenses` · `/admin/reports` · `/admin/sheets` · `/admin/csv` · `/admin/settings` · `/admin/audit` · `/admin/billing` (+ `/[id]`) · `/admin/accounting` · `/admin/design` · `/admin/design-elements` · `/admin/pages` · `/admin/banners` · `/admin/learning` · `/admin/profiles` · `/admin/integrations` · `/admin/sync` · `/admin/offers` · `/admin/feedback` · `/admin/business`

## 7. मुख्य फीचर्स (सभी चालू)
1. **सेवा कैटलॉग:** 450 सेवाएँ (18 मूल + 7 नई श्रेणियाँ), शुल्क (दुकान/सरकारी/बुकिंग), समय, दस्तावेज़, ऑफिशियल लिंक, **सेवा मोड: 🏪 दुकान पर / 🌐 बिना दुकान आए / दोनों**
2. **मास्टर आवेदन:** किसी भी मेन्यू से कितनी भी सेवाएँ टिक करें (Service Picker + खोज/श्रेणी/मोड फ़िल्टर), साथ के कार्य, एक Master ID
3. **Dynamic सेवा-विशेष फॉर्म:** `services.form_fields` (JSON) → date/select/text/textarea/number फील्ड
4. **दस्तावेज़:** मल्टी-अपलोड + कैमरा, 5 KB–100 MB, ZIP, कस्टमर View/Edit/Replace(v2)/Delete/Download/Print, एडमिन तैयार दस्तावेज़ अपलोड, ग्राहक फोल्डर ZIP, दोबारा माँगें (remark + WhatsApp)
5. **बिलिंग:** Multi-item Bill Builder, स्टॉक घटता है, भुगतान रिकॉर्ड, Cancel + Audit, With/Without GST (GSTIN, CGST+SGST/IGST)
6. **इनवॉइस:** मल्टी-आइटम + मेन्यू से सेवा चयन + उत्पाद सूची + GST + प्रिंट/PDF/Share/Edit/CSV
7. **बिलिंग-अकाउंटिंग मॉड्यूल:** स्टॉक, बिक्री, खरीद, ग्राहक उधारी, सेवा बुकिंग, डैशबोर्ड लाभ/बकाया
8. **ऑफर:** BOGO/Combo/Free Gift/Multi, दिनांक, फोटो, ON/OFF, Copy, 🔔 सूचना
9. **फीडबैक:** 1–5 स्टार, प्रतिशत वितरण, सेवा-वार, जवाब, Hide/Delete
10. **डिज़ाइन स्टूडियो:** 5 प्रीसेट थीम, रंग/रेडियस/शैडो/ग्रिड/फॉन्ट, लाइव Desktop/Mobile Preview, Save/Publish, **Version History + Restore**; Card & Button Designer; Page & Menu Designer; Banner Manager (7 पोज़िशन, शेड्यूल)
11. **15+ फ़िल्टर:** दिनांक-रेंज, माह, वर्ष, दिन, समय, श्रेणी + **हर कॉलम का अलग फ़िल्टर** (text/select/date/number) + Sorting + Pagination + Clear All
12. **CSV/Excel:** 21+ एक्सपोर्ट + प्रति-सेवा CSV (`/exports/services/[slug].csv`) + `=IMPORTDATA` समर्थित
13. **Google Sheets:** Service Account (JWT→OAuth) या Apps Script Webhook; 18 शीट सिंक; नया रिकॉर्ड अपने-आप जुड़ता है (कुंजियों के बाद)
14. **ऑफलाइन:** Online/Offline/सिंक स्टेटस, स्थानीय क्यू, Sync Now, offlineKey से डुप्लीकेट रोकथाम, Sync History
15. **बैकअप:** हर एडमिन पेज पर `/api/backup` (पूरा JSON, पासवर्ड हैश रहित)
16. **PWA:** इंस्टॉल, offline पेज, service worker, Google verification फ़ाइल `public/google5bba588b830c7890.html`
17. **सुरक्षा:** भूमिका-आधारित अनुमति (Owner/Manager/Operator/Customer), HttpOnly signed cookies, फ़ाइल एक्सेस नियंत्रण, ऑडिट लॉग, कस्टमर को एडमिन लिंक नहीं

## 8. Environment Variables (नाम केवल — कोई कुंजी खुद न बनाएँ)
| Variable | अनिवार्य | उपयोग |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (हाल में: `postgresql://postgres:postgres@127.0.0.1:5432/app_db`) |
| `AUTH_SECRET` | ✅ (production) | स्टाफ/कस्टमर cookie साइनिंग (लंबा रैंडम) |
| `GOOGLE_SHEET_ID` | वैकल्पिक | Google Sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | वैकल्पिक | Service Account email |
| `GOOGLE_PRIVATE_KEY` | वैकल्पिक | Service Account private key (`\n` escapes सहित) |
| `GOOGLE_SHEETS_WEBHOOK_URL` | वैकल्पिक | Apps Script doPost webhook |
| `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_CLIENT_EMAIL` | वैकल्पिक | पुराने नाम (समर्थित) |

## 9. स्पष्ट सीमाएँ (छिपी नहीं)
- **Google Sheet:** कुंजियों के बिना “Not Configured” ही दिखता है (झूठा Connected नहीं)। CSV पूरी तरह काम करता है।
- **UPI:** QR/UTR/स्क्रीनशॉट मैन्युअल सत्यापन; **स्वतः Verified नहीं** — बैंक/गेटवे API चाहिए। ऐप OTP/PIN कभी नहीं माँगता।
- **Push Notification:** वर्तमान में इन-ऐप 🔔; मोबाइल Push के लिए Web-Push VAPID/Firebase कुंजियाँ चाहिए।
- **फ्रेम:** कुछ सरकारी/बैंक साइटें iframe नहीं खोलतीं (X-Frame-Options) — “नए टैब” विकल्प दिया गया है।
- **फ़ाइल स्टोरेज:** DB में Base64 (बैकअप में शामिल)। बहुत बड़े पैमाने पर S3/R2 + resumable upload अनुशंसित।
- **Multi-tenant / RLS:** अभी एकल दुकान स्कीमा; PostgreSQL RLS व कई दुकानें चाहिए तो अलग कार्य।

## 10. स्थानीय रूप से चलाना
```bash
npm install
echo 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db' > .env
npx drizzle-kit push          # स्कीमा लागू (डेटा सुरक्षित रहता है)
npm run build && npm run start # http://localhost:3000
```
पहली बार `/api/health` खोलने पर सीड अपने-आप: categories, 450 सेवाएँ, 150 वेबसाइट, डेमो ग्राहक/आवेदन/बिल/इनवॉइस/ऑफर/ट्रेनिंग/प्रोफाइल/बैनर/डिज़ाइन कार्ड-बटन। सीड **idempotent** है और डुप्लीकेट सेवा अपने-आप साफ़ करता है।

## 11. स्थायी Production Deploy (Vercel + Neon) — चरण
1. **Neon** पर नया Postgres प्रोजेक्ट → `DATABASE_URL` (sslmode=require) कॉपी करें (या मौजूदा DB का ही उपयोग करें)।
2. GitHub पर रिपॉज़िटरी पुश करें।
3. **Vercel → New Project → Import** → Environment Variables: `DATABASE_URL`, `AUTH_SECRET` (+ वैकल्पिक Google Sheets कुंजियाँ)।
4. Deploy → `https://<project>.vercel.app` (कस्टम डोमेन जोड़ें)।
5. **Migrations:** `DATABASE_URL=<production> npx drizzle-kit push` (डेटा सुरक्षित रहता है; कभी `drop` न करें)।
6. **सत्यापन:** होम, `/login`, कस्टमर लॉगिन, आवेदन सबमिट, दस्तावेज़ अपलोड, बिल/इनवॉइस, `/api/health`।
7. **बैकअप:** `/api/backup` + `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql` (हर हफ्ते)।
8. **Restore:** `psql "$DATABASE_URL" < backup.sql` (पहले staging पर परखें)।
9. **RLS (यदि चाहिए):** कई दुकानों/भूमिकाओं के लिए Postgres Row Level Security नीतियाँ लागू करें — अभी ऐप-स्तर पर भूमिका जाँच लागू है।

> मैं बिना आपके Vercel/Neon खाते व कुंजियों के सार्वजनिक production URL नहीं बना सकता — कुंजियाँ दें तो यही चरण दोहराए जा सकते हैं। कोई कुंजी मैंने स्वयं नहीं बनाई है।

## 12. नई चैट के लिए Master Prompt (कॉपी-पेस्ट)
```markdown
Mere existing project "DP Digital Seva Kendra" (Dheerendra Prajapati Computer Hardware, Software &
Digital Seva Kendra) par kaam continue karo. Structure: Next.js 16 App Router + TypeScript +
Tailwind 4 + PostgreSQL/Drizzle ORM. Poora handoff HANDOFF.md file me hai — pehle padho.

Current state: 450 services (0 duplicate), 25 categories, 150 websites, admin panel me 30 pages
(billing, invoices, documents, design studio, banners, pages/menus, learning, profiles,
integrations, offline sync, reports, audit), multi-service master application, GST billing,
column-wise filters everywhere, customer document manager (view/edit/replace/delete/download/
print), customer business-profile builder, PWA, CSV/Google-Sheets integration.

Ab mera target: isi app ko production-ready karke Vercel par deploy karna.
Rules: maujooda design/pages/features waise hi rahenge; maujooda PostgreSQL database hi use hoga;
naya database nahi banaunga aur purana data delete nahi karunga; bina anumati koi destructive
change nahi. Pehle database/backend audit karo, phir migrations (drizzle-kit push), env vars list
(DATABASE_URL, AUTH_SECRET, optional GOOGLE_*), persistent file storage plan, backup/restore,
security (role-based + RLS options) tayyar karo. Vercel deploy ke liye mujhse account/keys maango.
Deploy ke baad login, customer login, application submit, document upload aur data persistence
test karke mujhe production URL aur status report do. Jo API key/account chahiye wo pehle poochho.
```

## 13. अंतिम सत्यापन स्थिति
- ✅ `npx next typegen` · `tsc --noEmit` · `npm run build` · `build_and_start` (healthcheck OK)
- ✅ सभी पब्लिक + 30 एडमिन + कस्टमर पेज HTTP 200 (लॉगिन के बाद)
- ✅ `/api/health` → `{"status":"ok", "database":{"services":450,"categories":25,"websites":150}}`
- ✅ लॉगिन/आवेदन/बिल/इनवॉइस/दस्तावेज़/ZIP/CSV/डिज़ाइन/ऑफलाइन सिंक परीक्षण पास
