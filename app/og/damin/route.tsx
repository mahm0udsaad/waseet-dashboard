import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
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
            "linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #111827 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34 }}>
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
            ض
          </div>
          <div>وسيط الآن</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, lineHeight: 1.2, fontWeight: 700 }}>
            طلب ضامن جديد
          </div>
          <div style={{ fontSize: 30, opacity: 0.9 }}>
            راجع طلب الضامن في وسيط الآن
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
