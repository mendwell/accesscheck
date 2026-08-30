import { createHash, randomBytes } from "node:crypto";

export type StoredSite = { name: string; address: string; reviewer: string; email: string; volunteerHours: boolean; municipality: string; precinct: string; time: string; date: string; checkupType: "physical" | "event" | "digital" | "voting"; checklistVersion: string };
export type StoredAnswer = { result?: "pass" | "attention" | "unsure" | "na"; note?: string; value?: string; selections?: string[]; questionTitle?: string };

export type CheckupPayload = {
  site: StoredSite;
  answers: Record<string, StoredAnswer>;
  sectionIndex: number;
};

const allowedResults = new Set(["pass", "attention", "unsure", "na"]);

export function validatePayload(input: unknown): CheckupPayload | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const rawSite = value.site;
  const rawAnswers = value.answers;
  if (!rawSite || typeof rawSite !== "object" || !rawAnswers || typeof rawAnswers !== "object") return null;

  const siteValue = rawSite as Record<string, unknown>;
  const clean = (key: string, max: number) => typeof siteValue[key] === "string" ? siteValue[key].slice(0, max) : "";
  const site: StoredSite = {
    name: clean("name", 200),
    address: clean("address", 500),
    reviewer: clean("reviewer", 200),
    email: clean("email", 320),
    volunteerHours: siteValue.volunteerHours === true,
    municipality: clean("municipality", 200),
    precinct: clean("precinct", 100),
    time: clean("time", 10),
    date: clean("date", 10),
    checkupType: siteValue.checkupType === "event" || siteValue.checkupType === "digital" || siteValue.checkupType === "voting" ? siteValue.checkupType : "physical",
    checklistVersion: clean("checklistVersion", 100),
  };

  const answers: Record<string, StoredAnswer> = {};
  for (const [id, rawAnswer] of Object.entries(rawAnswers)) {
    if (!/^[a-z]{1,3}[0-9]+$/.test(id) || !rawAnswer || typeof rawAnswer !== "object") continue;
    const answer = rawAnswer as Record<string, unknown>;
    const result = typeof answer.result === "string" && allowedResults.has(answer.result) ? answer.result as StoredAnswer["result"] : undefined;
    const note = typeof answer.note === "string" ? answer.note.slice(0, 2000) : undefined;
    const responseValue = typeof answer.value === "string" ? answer.value.slice(0, 500) : undefined;
    const selections = Array.isArray(answer.selections) ? answer.selections.filter((item): item is string => typeof item === "string").slice(0, 20).map((item) => item.slice(0, 500)) : undefined;
    const questionTitle = typeof answer.questionTitle === "string" ? answer.questionTitle.slice(0, 500) : undefined;
    answers[id] = { ...(result ? { result } : {}), ...(note ? { note } : {}), ...(responseValue ? { value: responseValue } : {}), ...(selections?.length ? { selections } : {}), ...(questionTitle ? { questionTitle } : {}) };
  }

  const sectionIndex = Number.isInteger(value.sectionIndex) ? Math.min(4, Math.max(0, Number(value.sectionIndex))) : 0;
  return { site, answers, sectionIndex };
}

export function createEditToken() {
  return randomBytes(24).toString("base64url");
}

export function hashEditToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return { url, key };
}

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase request failed", response.status, detail.slice(0, 500));
    throw new Error("The checkup database is unavailable.");
  }
  return response;
}

export function requestToken(request: Request) {
  return request.headers.get("x-edit-token")?.slice(0, 200) || "";
}

export function bodyTooLarge(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  return length > 250_000;
}
