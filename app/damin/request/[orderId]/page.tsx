import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicDaminPage } from "@/components/public/PublicPageScaffold";
import { SITE_URL } from "@/lib/app-links";
import { getPublicDaminOrder } from "@/lib/public-content";

type Props = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const url = `${SITE_URL}/damin/request/${orderId}`;
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

export default async function DaminRequestPathPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getPublicDaminOrder(orderId);

  if (!order) notFound();

  return <PublicDaminPage order={order} />;
}
