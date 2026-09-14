export function getSiteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://recipe.app";
}

export function roadmapShareUrl(id: string): string {
  return `${getSiteOrigin()}/roadmap/${id}`;
}

//Xの投稿文。図がメインになるよう短くし、末尾に宣伝URLを置く
export function roadmapShareText(title: string, id: string): string {
  return `${title}\n\nrecipeで公開中\n${roadmapShareUrl(id)}`;
}

export function twitterIntentUrl(title: string, id: string): string {
  const text = roadmapShareText(title, id);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function lineShareUrl(id: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(roadmapShareUrl(id))}`;
}

export function facebookShareUrl(id: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(roadmapShareUrl(id))}`;
}

export function threadsShareUrl(title: string, id: string): string {
  return `https://www.threads.net/intent/post?text=${encodeURIComponent(roadmapShareText(title, id))}`;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
