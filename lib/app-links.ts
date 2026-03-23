const DEFAULT_SITE_URL = "https://www.wasitalan.com";
export const ANDROID_PACKAGE_NAME = "com.mahm09d.kafel";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_SITE_URL;

export const IOS_APP_STORE_URL =
  "https://apps.apple.com/us/app/%D9%88%D8%B3%D9%8A%D8%B7-%D8%A7%D9%84%D8%A2%D9%86/id6756179253";

export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

export const APPLE_APP_ID =
  process.env.APPLE_APP_ID ?? "I8982413707.com.mahm09d.kafel";

export const ANDROID_SHA256_FINGERPRINT =
  process.env.ANDROID_SHA256_FINGERPRINT ??
  "REPLACE_WITH_RELEASE_SHA256_FINGERPRINT";

function withScheme(pathname: string, query?: Record<string, string>) {
  const url = new URL(`kafel:///${pathname}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export function buildListingUrl(type: "tanazul" | "taqib", id: string) {
  return `${SITE_URL}/${type}/${id}`;
}

export function buildListingAppUrl(type: "tanazul" | "taqib", id: string) {
  const pathname = type === "tanazul" ? "tanazul-details" : "taqib-ad-details";
  return withScheme(pathname, { id });
}

export function buildDaminRequestUrl(orderId: string) {
  return `${SITE_URL}/damin/request?order_id=${encodeURIComponent(orderId)}`;
}

export function buildDaminInviteUrl(token: string) {
  return `${SITE_URL}/damin/invite/${encodeURIComponent(token)}`;
}

export function buildDaminAppUrl(orderId: string) {
  return withScheme("damin-order-details", { id: orderId });
}
