import { bodyTooLarge, createEditToken, hashEditToken, supabaseRequest, validatePayload } from "@/lib/checkups";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (bodyTooLarge(request)) return Response.json({ error: "Checkup is too large." }, { status: 413 });

  const payload = validatePayload(await request.json().catch(() => null));
  if (!payload) return Response.json({ error: "Invalid checkup data." }, { status: 400 });

  const editToken = createEditToken();
  const tokenHash = hashEditToken(editToken);
  const response = await supabaseRequest("checkups?select=id,status,created_at,updated_at", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      edit_token_hash: tokenHash,
      site: payload.site,
      answers: payload.answers,
      section_index: payload.sectionIndex,
    }),
  });
  const rows = await response.json() as Array<Record<string, unknown>>;

  return Response.json({ ...rows[0], editToken }, { status: 201 });
}
