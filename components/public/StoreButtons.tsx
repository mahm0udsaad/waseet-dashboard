import Link from "next/link";
import Image from "next/image";
import { GOOGLE_PLAY_URL, IOS_APP_STORE_URL } from "@/lib/app-links";

type Props = {
  emphasized?: "ios" | "android";
  locale?: "ar" | "en";
  variant?: "default" | "badge";
};

export function StoreButtons({
  emphasized,
  locale = "en",
  variant = "default",
}: Props) {
  const primaryIos = emphasized !== "android";
  const appStoreLabel =
    locale === "ar" ? "حمّل من App Store" : "Download on the App Store";
  const playStoreLabel =
    locale === "ar" ? "حمّل من Google Play" : "Get it on Google Play";
  const appStoreOverline =
    locale === "ar" ? "حمّل عبر" : "Download on the";
  const playStoreOverline =
    locale === "ar" ? "حمّل عبر" : "Get it on";

  if (variant === "badge") {
    return (
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={IOS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-[96px] w-full items-center justify-between rounded-[1.6rem] border border-[#111827] bg-black px-8 py-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] transition-all hover:scale-[1.02] hover:bg-[#111111]"
        >
          <div className="text-left">
            <div className="text-xs font-medium tracking-[0.08em] text-white/75">
              {appStoreOverline}
            </div>
            <div className="mt-1 text-[2rem] font-bold leading-none tracking-tight">
              App Store
            </div>
          </div>
          <Image
            src="https://www.svgrepo.com/show/452159/app-store.svg"
            alt="App Store"
            width={54}
            height={54}
            className="h-[54px] w-[54px] rounded-full"
            unoptimized
          />
        </Link>
        <Link
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-[96px] w-full items-center justify-between rounded-[1.6rem] border border-[#d7dce5] bg-white px-8 py-5 text-gray-900 shadow-[0_20px_50px_rgba(148,163,184,0.18)] transition-all hover:scale-[1.02] hover:bg-[#fbfdff]"
        >
          <div className="text-left">
            <div className="text-xs font-medium tracking-[0.08em] text-gray-500">
              {playStoreOverline}
            </div>
            <div className="mt-1 text-[2rem] font-bold leading-none tracking-tight">
              Google Play
            </div>
          </div>
          <Image
            src="https://www.svgrepo.com/show/452223/google-play.svg"
            alt="Google Play"
            width={54}
            height={54}
            className="h-[54px] w-[54px]"
            unoptimized
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={IOS_APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-2xl px-5 py-4 text-sm font-semibold transition ${
          primaryIos
            ? "bg-gray-950 text-white hover:bg-gray-800"
            : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
        }`}
      >
        {appStoreLabel}
      </Link>
      <Link
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-2xl px-5 py-4 text-sm font-semibold transition ${
          primaryIos
            ? "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
            : "bg-gray-950 text-white hover:bg-gray-800"
        }`}
      >
        {playStoreLabel}
      </Link>
    </div>
  );
}
