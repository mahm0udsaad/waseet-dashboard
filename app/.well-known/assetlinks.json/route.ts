import { ANDROID_SHA256_FINGERPRINT } from "@/lib/app-links";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.mahm09d.kafel",
          sha256_cert_fingerprints: [ANDROID_SHA256_FINGERPRINT],
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
