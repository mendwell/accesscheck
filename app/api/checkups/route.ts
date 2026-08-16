import { bodyTooLarge, createEditToken, database, hashEditToken, validatePayload } from "@/lib/checkups";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (bodyTooLarge(request)) return Response.json({ error: "Checkup is too large." }, { status: 413 });

  const payload = validatePayload(await request.json().catch(() => null));
  if (!payload) return Response.json({ error: "Invalid checkup data." }, { status: 400 });

  const editToken = createEditToken();
  const tokenHash = hashEditToken(editToken);
  const sql = database();
  const rows = await sql`
    INSERT INTO checkups (edit_token_hash, site, answers, section_index)
    VALUES (${tokenHash}, ${JSON.stringify(payload.site)}::jsonb, ${JSON.stringify(payload.answers)}::jsonb, ${payload.sectionIndex})
    RETURNING id, status, created_at, updated_at
  ` as Array<Record<string, unknown>>;

  return Response.json({ ...rows[0], editToken }, { status: 201 });
}
