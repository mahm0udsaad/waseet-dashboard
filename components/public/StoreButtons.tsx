import Link from "next/link";
import { GOOGLE_PLAY_URL, IOS_APP_STORE_URL } from "@/lib/app-links";

type Props = {
  emphasized?: "ios" | "android";
};

export function StoreButtons({ emphasized }: Props) {
  const primaryIos = emphasized !== "android";

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
        Download on the App Store
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
        Get it on Google Play
      </Link>
    </div>
  );
}
