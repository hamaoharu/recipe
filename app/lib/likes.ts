import { createClient } from "./supabase/client";

//配列からオブジェクトに変換
export const idsToRecord = (ids: string[]): Record<string, boolean> =>
  Object.fromEntries(ids.map((id) => [id, true]));

async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function getLikedIds(): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmap_likes")
    .select("roadmap_id")
    .eq("user_id", userId);
  if (error) return [];

  return (data ?? []).map((row) => row.roadmap_id as string);
}

export async function getBookmarkedIds(): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmap_bookmarks")
    .select("roadmap_id")
    .eq("user_id", userId);
  if (error) return [];

  return (data ?? []).map((row) => row.roadmap_id as string);
}

//押した結果いいねが付いた状態なら true
export async function toggleLike(
  roadmapId: string,
  currentlyLiked: boolean,
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return currentlyLiked;

  const supabase = createClient();

  if (currentlyLiked) {
    const { error } = await supabase
      .from("roadmap_likes")
      .delete()
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId);
    return error ? currentlyLiked : false;
  }

  const { error } = await supabase
    .from("roadmap_likes")
    .insert({ user_id: userId, roadmap_id: roadmapId });
  return error ? currentlyLiked : true;
}

export async function toggleBookmark(
  roadmapId: string,
  currentlyBookmarked: boolean,
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return currentlyBookmarked;

  const supabase = createClient();

  if (currentlyBookmarked) {
    const { error } = await supabase
      .from("roadmap_bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId);
    return error ? currentlyBookmarked : false;
  }

  const { error } = await supabase
    .from("roadmap_bookmarks")
    .insert({ user_id: userId, roadmap_id: roadmapId });
  return error ? currentlyBookmarked : true;
}
