"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProfileDraft = {
  slug: string; name: string; category: string; ownerName: string; phone: string; whatsapp: string; email: string;
  address: string; mapsUrl: string; description: string; servicesText: string; productsText: string;
  workingHours: string; logoUrl: string; coverUrl: string; websiteUrl: string; socialLinks: string;
  template: string; primaryColor: string; accentColor: string; layout: string; published: boolean;
};

const empty: ProfileDraft = {
  slug: "", name: "", category: "स्थानीय व्यवसाय", ownerName: "", phone: "", whatsapp: "", email: "", address: "",
  mapsUrl: "", description: "", servicesText: "", productsText: "", workingHours: "", logoUrl: "", coverUrl: "",
  websiteUrl: "", socialLinks: "", template: "classic", primaryColor: "#4f46e5", accentColor: "#f97316", layout: "hero", published: true,
};

export default function CustomerBusinessBuilder({ initial, mobile }: { initial: ProfileDraft | null; mobile: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileDraft>(initial ?? { ...empty, ownerName: "", phone: mobile, whatsapp: mobile });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  const set = (key: keyof ProfileDraft, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save(published: boolean) {
    if (!form.name.trim()) { setMessage("❌ बिज़नेस नाम आवश्यक है"); return; }
    setBusy(true);
    const response = await fetch("/api/customer/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, published }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(`❌ ${json?.error ?? "सहेजा नहीं जा सका"}`);
      return;
    }
    const json = (await response.json()) as { slug: string };
    setSlug(json.slug);
    setMessage(published ? "✅ प्रोफाइल प्रकाशित — लिंक तैयार है" : "📝 ड्राफ्ट सुरक्षित (अप्रकाशित)");
    router.refresh();
  }

  const publicPath = slug ? `/business/${slug}` : "";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🏪 मेरा बिज़नेस प्रोफाइल बनाएँ</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div><label className="label">बिज़नेस नाम *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">श्रेणी</label><input value={form.category} onChange={(e) => set("category", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">मालिक का नाम</label><input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">मोबाइल</label><input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} className="input py-1.5 text-xs" /></div>
          <div><label className="label">WhatsApp</label><input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))} className="input py-1.5 text-xs" /></div>
          <div><label className="label">ईमेल</label><input value={form.email} onChange={(e) => set("email", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div className="sm:col-span-2"><label className="label">पता</label><input value={form.address} onChange={(e) => set("address", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div className="sm:col-span-2"><label className="label">Google Maps लिंक</label><input value={form.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div className="sm:col-span-2"><label className="label">विवरण</label><textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div className="sm:col-span-2"><label className="label">सेवाएँ (कॉमा से अलग)</label><textarea rows={2} value={form.servicesText} onChange={(e) => set("servicesText", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div className="sm:col-span-2"><label className="label">उत्पाद (कॉमा से अलग)</label><textarea rows={2} value={form.productsText} onChange={(e) => set("productsText", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">कार्य समय</label><input value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">वेबसाइट / सोशल लिंक</label><input value={form.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">Logo URL / /api/files/ID</label><input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div><label className="label">Cover फोटो URL</label><input value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} className="input py-1.5 text-xs" /></div>
          <div>
            <label className="label">टेम्पलेट</label>
            <select value={form.template} onChange={(e) => set("template", e.target.value)} className="input py-1.5 text-xs">
              {["classic", "modern", "minimal", "bold"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">लेआउट</label>
            <select value={form.layout} onChange={(e) => set("layout", e.target.value)} className="input py-1.5 text-xs">
              {["hero", "split", "card"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">मुख्य रंग</label><input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="input h-9 py-1" /></div>
          <div><label className="label">दूसरा रंग</label><input type="color" value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="input h-9 py-1" /></div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" disabled={busy} onClick={() => save(true)} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "🚀 Publish / सहेजें"}</button>
          <button type="button" disabled={busy} onClick={() => save(false)} className="btn-ghost px-3 py-1.5 text-xs">📝 Draft सेव करें</button>
          {slug ? <a href={publicPath} target="_blank" rel="noreferrer" className="btn-soft px-3 py-1.5 text-xs">👁 Preview</a> : null}
          {slug ? (
            <button
              type="button"
              onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}${publicPath}`); setMessage("🔗 लिंक कॉपी हो गया"); }}
              className="btn-ghost px-3 py-1.5 text-xs"
            >📋 Copy Link</button>
          ) : null}
          {slug ? <a href={`https://wa.me/?text=${encodeURIComponent(`मेरा बिज़नेस प्रोफाइल देखें: ${typeof window !== "undefined" ? window.location.origin : ""}${publicPath}`)}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">💬 WhatsApp Share</a> : null}
        </div>
        {message ? <p className="mt-1.5 rounded-xl bg-slate-100 px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{message}</p> : null}
        {slug ? <p className="mt-1 text-[10px] text-slate-400">सार्वजनिक लिंक: <span className="font-mono">/business/{slug}</span></p> : null}
      </div>
    </div>
  );
}
