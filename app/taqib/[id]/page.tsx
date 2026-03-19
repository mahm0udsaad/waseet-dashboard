import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicAdPage } from "@/components/public/PublicPageScaffold";
import { SITE_URL, buildListingUrl } from "@/lib/app-links";
import { buildAdDescription, buildAdTitle, getPublicAd } from "@/lib/public-content";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ad = await getPublicAd("taqib", id);

  if (!ad) {
    return {
      title: "إعلان غير موجود",
      robots: { index: false, follow: false },
    };
  }

  const title = buildAdTitle(ad);
  const description = buildAdDescription(ad);
  const url = buildListingUrl("taqib", ad.id);
  const image = `${SITE_URL}/og/listing?type=taqib&title=${encodeURIComponent(
    title
  )}&price=${encodeURIComponent(ad.price?.toString() ?? "")}&location=${encodeURIComponent(
    ad.location ?? ""
  )}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "وسيط الآن",
      locale: "ar_SA",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function TaqibListingPage({ params }: Props) {
  const { id } = await params;
  const ad = await getPublicAd("taqib", id);

  if (!ad) notFound();

  return <PublicAdPage ad={ad} type="taqib" />;
}
