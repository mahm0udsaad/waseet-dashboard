import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const APP_NAME = "وسيط الآن";
const APP_DESCRIPTION = "المنصة الأولى والآمنة لخدمات التنازل، التعقيب، والخدمات العامة في المملكة العربية السعودية. نضمن حقوقك المالية والقانونية.";
const APP_URL = "https://waseetalaan.com"; 

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Waseet Alaan Team" }],
  generator: "Next.js",
  keywords: [
    "تنازل", "نقل كفالة", "عمالة منزلية", "تعقيب", "خدمات عامة", "وساطة مالية",
    "ضمان مالي", "وسيط", "السعودية", "الرياض", "خدمات الكترونية", "تطبيق وسيط"
  ],
  referrer: "origin-when-cross-origin",
  creator: "Waseet Alaan",
  publisher: "Waseet Alaan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/KAFEL.png",
    shortcut: "/KAFEL.png",
    apple: "/KAFEL.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/KAFEL.png",
    },
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/KAFEL.png",
        width: 800,
        height: 800,
        alt: `${APP_NAME} Logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    creator: "@waseetalaan",
    images: ["/KAFEL.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${cairo.variable} font-sans antialiased bg-white text-gray-900 overflow-x-hidden selection:bg-red-100 selection:text-red-900`}>
        {children}
      </body>
    </html>
  );
}