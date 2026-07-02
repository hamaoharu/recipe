import { ROADMAPS } from "../../lib/roadmaps";

// /api/roadmapsにGETが来たら、ROADMAPSをJSONで返すというルールを記載
export async function GET() {
  return Response.json(ROADMAPS);
}