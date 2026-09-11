"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RoadmapForm, { type RoadmapFormResult } from "../../components/RoadmapForm";
import { authorFromUser } from "../../lib/auth";
import { createRoadmap } from "../../lib/roadmaps-db";
import { createClient } from "../../lib/supabase/client";

export default function NewRoadmapPage() {
  const router = useRouter();

  //ログインチェック
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login?next=/roadmap/new");
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (values: RoadmapFormResult) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/login?next=/roadmap/new");
      return;
    }

    const id = await createRoadmap({
      ...values,
      author: authorFromUser(data.session.user),
    });
    router.push(`/roadmap/${id}`);
  };

  return (
    <RoadmapForm
      heading="ロードマップを構築する"
      submitLabel="投稿する"
      submittingLabel="投稿中..."
      cancelHref="/"
      onSubmit={handleSubmit}
    />
  );
}
