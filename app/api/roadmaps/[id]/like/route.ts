import { ROADMAPS } from "@/app/lib/roadmaps";

export async function POST (
    request: Request,
    {params}: {params: Promise<{id: string}>}
) {
    const {id} = await params;
    const roadmap = ROADMAPS.find((roadmap) => roadmap.id === id);
    if(!roadmap){
        //早期リターン
        return Response.json({ error: "not found" }, { status: 404 });
    }

    roadmap.likes++;
    return Response.json({ likes: roadmap.likes });

}