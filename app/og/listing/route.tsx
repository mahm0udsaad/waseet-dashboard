import { ImageResponse } from "next/og";
import { formatMoney } from "@/lib/public-content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "taqib" ? "تعقيب" : "تنازل";
  const title = searchParams.get("title") || "وسيط الآن";
  const location = searchParams.get("location") || "المملكة العربية السعودية";
  const rawPrice = searchParams.get("price");
  const price = rawPrice ? formatMoney(Number(rawPrice)) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #111827 0%, #7f1d1d 55%, #f59e0b 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 34,
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.14)",
              }}
            >
              و
            </div>
            <div>وسيط الآن</div>
          </div>
          <div
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "12px 22px",
              fontSize: 28,
            }}
          >
            {type}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 62, lineHeight: 1.2, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 28, opacity: 0.9 }}>
            {price ? <div>{price}</div> : null}
            <div>{location}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
