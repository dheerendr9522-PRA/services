import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "सेवा शर्तें" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader eyebrow="Terms" title="सेवा शर्तें" subtitle="Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra" />
      <Card className="space-y-2 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>1. यह केंद्र केवल आवेदन सहायता सेवा देता है; सरकारी स्वीकृति संबंधित विभाग का अधिकार है।</p>
        <p>2. सभी शुल्क दुकान द्वारा निर्धारित/अनुमानित हैं। सरकारी शुल्क पोर्टल पर अलग देय होता है।</p>
        <p>3. अनुमानित समय केवल अनुमान है; विभागीय देरी के लिए दुकान उत्तरदायी नहीं है।</p>
        <p>4. गलत/अपूर्ण दस्तावेज़ पर आवेदन अस्वीकृत हो सकता है — शुल्क वापसी लागू नहीं।</p>
        <p>5. रिपेयर में डेटा बैकअप ग्राहक की ज़िम्मेदारी है। बिजली/प्राकृतिक क्षति के लिए दुकान उत्तरदायी नहीं।</p>
        <p>6. रेल/फ्लाइट/होटल बुकिंग के नियम संबंधित प्रदाता (IRCTC/एयरलाइन/होटल) के अनुसार होंगे।</p>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          भुगतान UPI ID dheerendr9522@upi पर ही करें। रसीद के बिना नकद भुगतान न करें।
        </p>
        <Link href="/pay" className="btn-primary mt-1 px-3 py-1.5 text-xs">
          UPI भुगतान देखें
        </Link>
      </Card>
    </div>
  );
}
