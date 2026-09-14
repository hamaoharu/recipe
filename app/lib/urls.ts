//保存・表示とも http / https 以外は使わない
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeResources(
  resources: { label: string; url: string | null; note: string }[],
) {
  return resources.map((r) => ({
    ...r,
    url: safeHttpUrl(r.url),
  }));
}
