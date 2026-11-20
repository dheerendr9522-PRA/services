import QRCode from "qrcode";

export function upiUri(upiId: string, name: string, amount?: number, note?: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    cu: "INR",
  });
  if (amount && amount > 0) params.set("am", String(amount));
  if (note) params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}

export async function makeQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 260,
      margin: 1,
      color: { dark: "#312e81", light: "#ffffff" },
    });
  } catch {
    return "";
  }
}
