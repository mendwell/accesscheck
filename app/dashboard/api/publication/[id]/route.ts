import { cookies } from "next/headers";
import { dashboardCookie, validDashboardToken } from "@/lib/dashboard-auth";
import { supabaseRequest } from "@/lib/checkups";

export const runtime = "nodejs";

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!validDashboardToken(jar.get(dashboardCookie)?.value)) return Response.json({ error: "Not authorized." }, { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid checkup." }, { status: 400 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  const publish = body.publish === true;
  const locationName = cleanText(body.locationName, 200);
  const locationDetail = cleanText(body.locationDetail, 300);
  const locationMode = body.locationMode === "exact" ? "exact" : "approximate";
  const latitude = body.latitude === null || body.latitude === "" ? null : Number(body.latitude);
  const longitude = body.longitude === null || body.longitude === "" ? null : Number(body.longitude);

  const existingResponse = await supabaseRequest(`checkups?select=site,status&id=eq.${encodeURIComponent(id)}&limit=1`);
  const existing = await existingResponse.json() as Array<{ site?: { checkupType?: string }; status?: string }>;
  if (!existing[0] || existing[0].status !== "submitted") return Response.json({ error: "Only submitted checkups can be published." }, { status: 404 });
  const moduleId = existing[0].site?.checkupType;

  if (publish && !locationName) return Response.json({ error: "Add a public location name before publishing." }, { status: 400 });
  if (publish && moduleId !== "digital" && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
    return Response.json({ error: "Find or enter map coordinates before publishing this module." }, { status: 400 });
  }
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) return Response.json({ error: "Latitude is invalid." }, { status: 400 });
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) return Response.json({ error: "Longitude is invalid." }, { status: 400 });

  await supabaseRequest(`checkups?id=eq.${encodeURIComponent(id)}&status=eq.submitted`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      is_public: publish,
      public_location_name: locationName || null,
      public_location_detail: locationDetail || null,
      public_location_mode: locationMode,
      public_latitude: latitude,
      public_longitude: longitude,
      published_at: publish ? new Date().toISOString() : null,
    }),
  });
  return Response.json({ ok: true, published: publish });
}
