import { getSupabaseServerClient } from "./supabase/server";

export async function sendExpoPushNotifications(params: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("expo_push_token")
    .in("user_id", params.userIds);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    sound: "default" as const,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
  }));

  // Batch in groups of 100 (Expo limit)
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
    } catch {
      // Best-effort: don't throw on push failure
    }
  }
}
