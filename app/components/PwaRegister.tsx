"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // 登録に失敗しても閲覧はそのまま使える
    });
  }, []);

  return null;
}
