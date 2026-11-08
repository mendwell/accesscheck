import { cookies } from "next/headers";
import { dashboardCookie, validDashboardToken } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const jar = await cookies();
  if (!validDashboardToken(jar.get(dashboardCookie)?.value)) return Response.json({ error: "Not authorized." }, { status: 401 });
  const body = await request.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
  if (query.length < 3) return Response.json({ error: "Enter a location to search." }, { status: 400 });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AccessCheckUp/1.0 (+https://access-checkup.netlify.app)",
      "Accept-Language": "en-US,en;q=0.8",
    },
    cache: "no-store",
  });
  if (!response.ok) return Response.json({ error: "The map search service is temporarily unavailable." }, { status: 502 });
  const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
  if (!results.length) return Response.json({ error: "No matching location was found. Try a fuller address or municipality." }, { status: 404 });
  return Response.json({ latitude: Number(results[0].lat), longitude: Number(results[0].lon), label: results[0].display_name });
}
