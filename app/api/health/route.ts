import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
function fail(reason: "missing_env" | "unreachable") {
  return Response.json({ supabase: "error", reason }, { status: 503 });
}
export async function GET() {
  let env: { url: string; key: string };
  try {
    env = getSupabaseEnv();
  } catch {
    return fail("missing_env");
  }
  try {
    // Leer cookies() vía el cliente server marca la ruta como dinámica.
    await createClient();
    const res = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fail("unreachable");
  } catch {
    return fail("unreachable");
  }
  return Response.json({ supabase: "ok" });
}
