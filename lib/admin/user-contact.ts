import { getSupabaseServerClient } from "@/lib/supabase/server";

type UserContactRecord = {
  user_id: string;
  email?: string | null;
  phone?: string | null;
};

export async function fillMissingUserContacts<
  T extends UserContactRecord,
>(records: T[]) {
  const supabase = getSupabaseServerClient();

  const missingIds = records
    .filter((record) => !record.phone || !record.email)
    .map((record) => record.user_id)
    .filter(Boolean);

  if (missingIds.length === 0) {
    return records;
  }

  const authEntries = await Promise.all(
    [...new Set(missingIds)].map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data.user) {
        return [userId, null] as const;
      }

      return [
        userId,
        {
          email: data.user.email ?? null,
          phone: data.user.phone ?? null,
        },
      ] as const;
    })
  );

  const authMap = new Map(authEntries);

  return records.map((record) => {
    const fallback = authMap.get(record.user_id);

    return {
      ...record,
      email: record.email ?? fallback?.email ?? null,
      phone: record.phone ?? fallback?.phone ?? null,
    };
  });
}
