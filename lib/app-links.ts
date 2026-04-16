const DEFAULT_SITE_URL = "https://www.wasitalan.com";

// Android package — matches the new EAS build's `android.package` in waseet-alan/app.json.
// The old build used `com.mahm09d.kafel` but has been replaced.
export const ANDROID_PACKAGE_NAME =
  process.env.ANDROID_PACKAGE_NAME ?? "com.wasitalan.app";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_SITE_URL;

export const IOS_APP_STORE_URL =
  "https://apps.apple.com/us/app/%D9%88%D8%B3%D9%8A%D8%B7-%D8%A7%D9%84%D8%A2%D9%86/id6756179253";

export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

// Apple App ID = <TeamID>.<BundleIdentifier>
// Team ID U99WN82SXG comes from eas.json submit.production.ios.appleTeamId.
// Bundle identifier com.mahm09d.kafel comes from waseet-alan/app.json ios.bundleIdentifier.
// If your actual App ID Prefix in Apple Developer Console differs (rare for new apps),
// set APPLE_APP_ID env var in Vercel to override.
export const APPLE_APP_ID =
  process.env.APPLE_APP_ID ?? "U99WN82SXG.com.mahm09d.kafel";

// SHA-256 fingerprint of the Android release signing key.
// Get it after the first EAS Android build:
//   eas credentials -p android  →  production  →  Keystore  →  view fingerprints
// Then set ANDROID_SHA256_FINGERPRINT in Vercel env vars.
// Format: "AA:BB:CC:..." (64 hex chars separated by colons).
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
