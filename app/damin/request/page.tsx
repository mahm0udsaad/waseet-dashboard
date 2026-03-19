import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicDaminPage } from "@/components/public/PublicPageScaffold";
import { SITE_URL, buildDaminRequestUrl } from "@/lib/app-links";
import { getPublicDaminOrder } from "@/lib/public-content";

type Props = {
  searchParams: Promise<{ order_id?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { order_id: orderId } = await searchParams;
  const url = orderId ? buildDaminRequestUrl(orderId) : `${SITE_URL}/damin/request`;
  const image = `${SITE_URL}/og/damin`;

  return {
    title: "طلب ضامن جديد",
    description: "راجع طلب الضامن في وسيط الآن",
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: "طلب ضامن جديد",
      description: "راجع طلب الضامن في وسيط الآن",
      url,
      siteName: "وسيط الآن",
      locale: "ar_SA",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: "طلب ضامن جديد",
      description: "راجع طلب الضامن في وسيط الآن",
      images: [image],
    },
  };
}

export default async function DaminRequestPage({ searchParams }: Props) {
  const { order_id: orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await getPublicDaminOrder(orderId);
  if (!order) notFound();

  return <PublicDaminPage order={order} />;
}
