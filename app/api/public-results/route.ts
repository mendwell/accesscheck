import { sanitizePublicResult, type PublicResultRow } from "@/lib/public-results";
import { supabaseRequest } from "@/lib/checkups";

export const runtime = "nodejs";

export async function GET() {
  try {
    const fields = "id,status,site,answers,submitted_at,is_public,public_location_name,public_location_detail,public_location_mode,public_latitude,public_longitude,published_at";
    const response = await supabaseRequest(`checkups?select=${fields}&is_public=eq.true&status=eq.submitted&order=published_at.desc&limit=2000`);
    const rows = await response.json() as PublicResultRow[];
    return Response.json(
      { results: rows.map(sanitizePublicResult) },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Public results unavailable", error);
    return Response.json({ error: "Public results are temporarily unavailable." }, { status: 503 });
  }
}
