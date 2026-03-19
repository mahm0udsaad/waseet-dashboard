import { APPLE_APP_ID } from "@/lib/app-links";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: APPLE_APP_ID,
            paths: ["/tanazul/*", "/taqib/*", "/damin/*"],
          },
        ],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
