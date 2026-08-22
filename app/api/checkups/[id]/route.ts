import { bodyTooLarge, hashEditToken, requestToken, supabaseRequest, validatePayload } from "@/lib/checkups";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const token = requestToken(request);
  if (!uuidPattern.test(id) || !token) return Response.json({ error: "Checkup not found." }, { status: 404 });

  const tokenHash = hashEditToken(token);
  const response = await supabaseRequest(`checkups?select=id,site,answers,section_index,status,created_at,updated_at,submitted_at&id=eq.${id}&edit_token_hash=eq.${tokenHash}&limit=1`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  if (!rows[0]) return Response.json({ error: "Checkup not found." }, { status: 404 });
  return Response.json(rows[0]);
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const token = requestToken(request);
  if (!uuidPattern.test(id) || !token) return Response.json({ error: "Checkup not found." }, { status: 404 });
  if (bodyTooLarge(request)) return Response.json({ error: "Checkup is too large." }, { status: 413 });

  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  const payload = validatePayload(raw);
  if (!payload) return Response.json({ error: "Invalid checkup data." }, { status: 400 });
  const submit = raw?.submit === true;
  const tokenHash = hashEditToken(token);
  const now = new Date().toISOString();
  const response = await supabaseRequest(`checkups?id=eq.${id}&edit_token_hash=eq.${tokenHash}&status=eq.draft&select=id,status,updated_at,submitted_at`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      site: payload.site,
      answers: payload.answers,
      section_index: payload.sectionIndex,
      updated_at: now,
      ...(submit ? { status: "submitted", submitted_at: now } : {}),
    }),
  });
  const rows = await response.json() as Array<Record<string, unknown>>;

  if (!rows[0]) {
    const existingResponse = await supabaseRequest(`checkups?select=status&id=eq.${id}&edit_token_hash=eq.${tokenHash}&limit=1`);
    const existing = await existingResponse.json() as Array<Record<string, unknown>>;
    if (existing[0]?.status === "submitted") return Response.json({ error: "This checkup has already been submitted." }, { status: 409 });
    return Response.json({ error: "Checkup not found." }, { status: 404 });
  }

  return Response.json(rows[0]);
}
