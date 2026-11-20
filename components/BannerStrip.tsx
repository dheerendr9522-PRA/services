import Link from "next/link";

export type BannerItem = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
  secondaryLabel: string | null;
  secondaryLink: string | null;
  bgColor: string | null;
  textColor: string | null;
  overlayOpacity: number;
  radius: number;
  displayType: string;
  altText: string | null;
};

export default function BannerStrip({ items, position }: { items: BannerItem[]; position: string }) {
  const banners = items.filter((item) => item && item.title);
  if (banners.length === 0) return null;
  return (
    <div className="space-y-2">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="relative overflow-hidden border border-white/20 shadow-sm"
          style={{ backgroundColor: banner.bgColor ?? "#4f46e5", color: banner.textColor ?? "#ffffff", borderRadius: banner.radius }}
          data-position={position}
        >
          {banner.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.imageUrl} alt={banner.altText ?? banner.title} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0" style={{ backgroundColor: `rgba(15,23,42,${banner.overlayOpacity / 100})` }} />
            </>
          ) : null}
          <div className="relative flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-snug sm:text-base">{banner.title}</p>
              {banner.subtitle ? <p className="mt-0.5 text-[11px] opacity-90 sm:text-xs">{banner.subtitle}</p> : null}
              {banner.description ? <p className="mt-0.5 text-[10px] opacity-80">{banner.description}</p> : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              {banner.buttonLabel && banner.buttonLink ? (
                <Link href={banner.buttonLink} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-900 hover:bg-white/90">{banner.buttonLabel}</Link>
              ) : null}
              {banner.secondaryLabel && banner.secondaryLink ? (
                <Link href={banner.secondaryLink} className="rounded-lg bg-white/20 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/30">{banner.secondaryLabel}</Link>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
