const TABLE = "checkups";

export default async () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase keepalive is missing SUPABASE_URL or a server key.");
  }

  const response = await fetch(`${url}/rest/v1/${TABLE}?select=id&limit=1`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase keepalive failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  console.log("Supabase keepalive succeeded.");
  return new Response(null, { status: 204 });
};
