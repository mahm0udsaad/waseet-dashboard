import Image from "next/image";

interface PhoneFrameProps {
  imageSrc: string;
  alt: string;
  priority?: boolean;
}

export function PhoneFrame({
  imageSrc,
  alt,
  priority = false,
}: PhoneFrameProps) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      {/* Ambient glow behind the phone */}
      <div className="absolute -inset-8 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Phone body - titanium frame */}
      <div
        className="relative rounded-[3rem] sm:rounded-[3.2rem] p-[3px]"
        style={{
          background:
            "linear-gradient(145deg, #e8e8e8 0%, #c4c4c6 15%, #a1a1a6 30%, #8e8e93 50%, #a1a1a6 70%, #c4c4c6 85%, #d4d4d8 100%)",
          boxShadow: `
            0 0 0 0.5px rgba(0,0,0,0.3),
            0 1px 2px rgba(0,0,0,0.2),
            0 4px 8px rgba(0,0,0,0.15),
            0 12px 24px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -1px 0 rgba(0,0,0,0.1)
          `,
        }}
      >
        {/* Inner black bezel */}
        <div
          className="relative rounded-[2.8rem] sm:rounded-[3rem] overflow-hidden"
          style={{
            background: "#1a1a1a",
            padding: "3px",
          }}
        >
          {/* Screen */}
          <div className="relative rounded-[2.65rem] sm:rounded-[2.85rem] overflow-hidden bg-black">


            {/* The app screenshot */}
            <div className="relative w-full">
              <Image
                src={imageSrc}
                alt={alt}
                width={640}
                height={1386}
                className="w-full h-auto block"
                priority={priority}
                style={{
                  display: "block",
                  borderRadius: "inherit",
                }}
              />
            </div>

            {/* Screen edge highlight for glass effect */}
            <div
              className="absolute inset-0 rounded-[2.65rem] sm:rounded-[2.85rem] pointer-events-none z-10"
              style={{
                boxShadow: `
                  inset 0 0 0 0.5px rgba(255,255,255,0.1),
                  inset 0 1px 0 rgba(255,255,255,0.05)
                `,
              }}
            />
          </div>
        </div>
      </div>

      {/* Physical buttons - Left side */}
      {/* Silent / Action button */}
      <div
        className="absolute top-[70px] sm:top-[80px] -left-[2.5px] w-[3.5px] h-[22px] sm:h-[26px] rounded-l-[2px]"
        style={{
          background:
            "linear-gradient(180deg, #d1d1d6 0%, #a1a1a6 30%, #8e8e93 70%, #a1a1a6 100%)",
          boxShadow:
            "-1px 0 2px rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.2)",
        }}
      />
      {/* Volume Up */}
      <div
        className="absolute top-[110px] sm:top-[126px] -left-[2.5px] w-[3.5px] h-[36px] sm:h-[42px] rounded-l-[2px]"
        style={{
          background:
            "linear-gradient(180deg, #d1d1d6 0%, #a1a1a6 30%, #8e8e93 70%, #a1a1a6 100%)",
          boxShadow:
            "-1px 0 2px rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.2)",
        }}
      />
      {/* Volume Down */}
      <div
        className="absolute top-[158px] sm:top-[180px] -left-[2.5px] w-[3.5px] h-[36px] sm:h-[42px] rounded-l-[2px]"
        style={{
          background:
            "linear-gradient(180deg, #d1d1d6 0%, #a1a1a6 30%, #8e8e93 70%, #a1a1a6 100%)",
          boxShadow:
            "-1px 0 2px rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.2)",
        }}
      />

      {/* Power button - Right side */}
      <div
        className="absolute top-[130px] sm:top-[148px] -right-[2.5px] w-[3.5px] h-[52px] sm:h-[60px] rounded-r-[2px]"
        style={{
          background:
            "linear-gradient(180deg, #d1d1d6 0%, #a1a1a6 30%, #8e8e93 70%, #a1a1a6 100%)",
          boxShadow:
            "1px 0 2px rgba(0,0,0,0.15), inset -1px 0 0 rgba(255,255,255,0.2)",
        }}
      />
    </div>
  );
}