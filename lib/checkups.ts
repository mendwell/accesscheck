import { createHash, randomBytes } from "node:crypto";
import { getDatabase } from "@netlify/database";

export type StoredSite = { name: string; address: string; reviewer: string; date: string; checkupType: "physical" | "event" | "digital" };
export type StoredAnswer = { result?: "pass" | "attention" | "unsure" | "na"; note?: string };

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
    date: clean("date", 10),
    checkupType: siteValue.checkupType === "event" || siteValue.checkupType === "digital" ? siteValue.checkupType : "physical",
  };

  const answers: Record<string, StoredAnswer> = {};
  for (const [id, rawAnswer] of Object.entries(rawAnswers)) {
    if (!/^[a-z][0-9]+$/.test(id) || !rawAnswer || typeof rawAnswer !== "object") continue;
    const answer = rawAnswer as Record<string, unknown>;
    const result = typeof answer.result === "string" && allowedResults.has(answer.result) ? answer.result as StoredAnswer["result"] : undefined;
    const note = typeof answer.note === "string" ? answer.note.slice(0, 2000) : undefined;
    answers[id] = { ...(result ? { result } : {}), ...(note ? { note } : {}) };
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

export function database() {
  return getDatabase().sql;
}

export function requestToken(request: Request) {
  return request.headers.get("x-edit-token")?.slice(0, 200) || "";
}

export function bodyTooLarge(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  return length > 250_000;
}
