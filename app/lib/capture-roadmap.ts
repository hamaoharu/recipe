import { toPng } from "html-to-image";
import { getSiteOrigin } from "./share";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

//地図のスクショに recipe のフッターを足す。Canva の「Made with」と同じ考え方
export async function captureRoadmapImage(
  element: HTMLElement,
  title: string,
): Promise<string> {
  const raw = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const img = await loadImage(raw);
  const footerH = 80;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height + footerH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("キャンバスを作成できませんでした");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, img.height, canvas.width, footerH);

  const markSize = Math.round(footerH * 0.55);
  try {
    const mark = await loadImage("/logo.png");
    ctx.drawImage(mark, 36, img.height + (footerH - markSize) / 2, markSize, markSize);
  } catch {
    //ロゴが取れなくてもフッターは出す
  }

  ctx.fillStyle = "#a1a1aa";
  ctx.font = `500 ${Math.round(canvas.width * 0.02)}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  const promo = getSiteOrigin().replace(/^https?:\/\//, "");
  ctx.fillText(`${title}  ·  ${promo}`, canvas.width - 36, img.height + footerH / 2);

  return canvas.toDataURL("image/png");
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}
