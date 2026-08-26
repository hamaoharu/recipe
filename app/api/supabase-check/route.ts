import { createClient } from "../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  return Response.json({
    ok: !error,
    hasSession: !!data.session,
    // まだログインしてないので hasSession は false で正常
  });
}