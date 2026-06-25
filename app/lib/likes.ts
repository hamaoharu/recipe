const LIKES_KEY = "recipe_likes";
const BOOKMARKS_KEY = "recipe_bookmarks";

export const getLikedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const toggleLike = (id: string): string[] => {
    //探しているid
    const ids = getLikedIds();

    //idが配列に含まれていたらそのidをを削除し、含まれていないなら追加する
    const next = ids.includes(id)
    ? ids.filter((x) => x !== id)
    : [...ids, id];

    //stringifyでJSON文字列に変換
    localStorage.setItem(LIKES_KEY, JSON.stringify(next));

    //更新後の配列を返す
    return next;
}

export const getBookmarkedIds = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]");
    } catch {
        return [];
    }
}

export const toggleBookmark = (id: string): string[] => {
    const ids = getBookmarkedIds();
    const next = ids.includes(id)
    ? ids.filter((x) => x !== id)
    : [...ids, id];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    return next;
}

