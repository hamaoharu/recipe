import type { Author } from "./types";

export const MOCK_USER: Author = {
  id: "shogo",
  name: "shogoLog",
  initial: "S",
};

export function getSafeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function loginWithMockUser(user: Author = MOCK_USER): void {
  localStorage.setItem("recipe_user", JSON.stringify(user));
}
