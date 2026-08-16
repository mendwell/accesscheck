import { bodyTooLarge, database, hashEditToken, requestToken, validatePayload } from "@/lib/checkups";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const token = requestToken(request);
  if (!uuidPattern.test(id) || !token) return Response.json({ error: "Checkup not found." }, { status: 404 });

  const sql = database();
  const rows = await sql`
    SELECT id, site, answers, section_index, status, created_at, updated_at, submitted_at
    FROM checkups
    WHERE id = ${id}::uuid AND edit_token_hash = ${hashEditToken(token)}
    LIMIT 1
  ` as Array<Record<string, unknown>>;
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
  const sql = database();

  const rows = await sql`
    UPDATE checkups
    SET site = ${JSON.stringify(payload.site)}::jsonb,
        answers = ${JSON.stringify(payload.answers)}::jsonb,
        section_index = ${payload.sectionIndex},
        status = CASE WHEN ${submit} THEN 'submitted' ELSE status END,
        submitted_at = CASE WHEN ${submit} THEN now() ELSE submitted_at END,
        updated_at = now()
    WHERE id = ${id}::uuid
      AND edit_token_hash = ${hashEditToken(token)}
      AND status = 'draft'
    RETURNING id, status, updated_at, submitted_at
  ` as Array<Record<string, unknown>>;

  if (!rows[0]) {
    const existing = await sql`SELECT status FROM checkups WHERE id = ${id}::uuid AND edit_token_hash = ${hashEditToken(token)} LIMIT 1` as Array<Record<string, unknown>>;
    if (existing[0]?.status === "submitted") return Response.json({ error: "This checkup has already been submitted." }, { status: 409 });
    return Response.json({ error: "Checkup not found." }, { status: 404 });
  }

  return Response.json(rows[0]);
}
