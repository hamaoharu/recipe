"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoadmapForm, {
  type RoadmapFormResult,
} from "../../../components/RoadmapForm";
import { fetchRoadmapBundle, updateRoadmap } from "../../../lib/roadmaps-db";
import { createClient } from "../../../lib/supabase/client";

export default function EditRoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [initialValues, setInitialValues] = useState<RoadmapFormResult | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied">("loading");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace(`/login?next=/roadmap/${id}/edit`);
        return;
      }

      try {
        const bundle = await fetchRoadmapBundle(id);
        //自分の投稿でなければ編集させない
        if (!bundle.roadmap || bundle.roadmap.author.id !== session.session.user.id) {
          setStatus("denied");
          return;
        }

        setInitialValues({
          title: bundle.roadmap.title,
          description: bundle.roadmap.description,
          tags: bundle.roadmap.tags,
          groups: bundle.groups.map((g) => ({
            id: g.id,
            label: g.label,
            nodes: g.nodes.map((n) => {
              const detail = bundle.details[n.id];
              return {
                id: n.id,
                label: n.label,
                required: n.required,
                days: n.days,
                description: detail?.description ?? "",
                resources: detail?.resources ?? [],
                criteria: (detail?.criteria ?? []).map((c) =>
                  typeof c === "string" ? c : c.text,
                ),
              };
            }),
          })),
        });
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setStatus("denied");
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (values: RoadmapFormResult) => {
    await updateRoadmap(id, values);
    router.push(`/roadmap/${id}`);
    router.refresh();
  };

  if (status === "loading") {
    return (
      <div
        className="flex items-center justify-center text-zinc-500"
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        読み込み中...
      </div>
    );
  }

  if (status === "denied" || !initialValues) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-zinc-500"
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        <p className="text-[14px]">このロードマップは編集できません。</p>
        <button
          type="button"
          onClick={() => router.push(`/roadmap/${id}`)}
          className="text-[13px] text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ロードマップに戻る
        </button>
      </div>
    );
  }

  return (
    <RoadmapForm
      heading="ロードマップを編集する"
      submitLabel="変更を保存"
      submittingLabel="保存中..."
      cancelHref={`/roadmap/${id}`}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
}
