import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "गोपनीयता नीति" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader eyebrow="Privacy" title="गोपनीयता नीति" subtitle="Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra" />
      <Card className="space-y-2 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>1. हम केवल सेवा प्रदान करने हेतु आवश्यक जानकारी (नाम, मोबाइल, पता, दस्तावेज़) एकत्र करते हैं।</p>
        <p>2. आपके दस्तावेज़ दुकान के सुरक्षित डेटाबेस में रखे जाते हैं और केवल आपके काम के लिए उपयोग होते हैं।</p>
        <p>3. हम कभी भी पूरा आधार नंबर, पैन, OTP या बैंक PIN दर्ज न करें — फॉर्म में ये जानकारी न लिखें।</p>
        <p>4. आपका डेटा किसी तीसरे पक्ष को बेचा नहीं जाता। Google Sheet सिंक केवल दुकान की निजी शीट में होता है।</p>
        <p>5. किसी भी जानकारी को हटाने के लिए दुकान पर 📞 7610420959 पर संपर्क करें।</p>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          सहमति: सेवा आवेदन जमा करने पर आप इस नीति से सहमत होते हैं।
        </p>
        <Link href="/contact" className="btn-primary mt-1 px-3 py-1.5 text-xs">
          संपर्क करें
        </Link>
      </Card>
    </div>
  );
}
