import type { User } from "@supabase/supabase-js";
import type { Author } from "./types";

export function getSafeRedirectPath(next: string | null): string {
  if (!next) return "/";
  //同一サイト内のパスだけ。// や /\ は別サイト扱いになり得る
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.includes("\\") || next.includes("://")) return "/";
  return next;
}

export function authorFromUser(user: User): Author {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    user.email?.split("@")[0] ||
    "user";
  const initial =
    (typeof meta.initial === "string" && meta.initial) ||
    name.slice(0, 1).toUpperCase();

  return {
    id: user.id,
    name,
    initial: initial.slice(0, 1).toUpperCase(),
  };
}
