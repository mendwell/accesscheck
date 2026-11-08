import type { StoredAnswer, StoredSite } from "@/lib/checkups";

export type ModuleId = StoredSite["checkupType"];
export type LocationMode = "exact" | "approximate";

export const moduleNames: Record<ModuleId, string> = {
  physical: "Likely physical barriers",
  event: "Event accessibility",
  digital: "Digital accessibility",
  voting: "Voting accessibility",
};

export type PublicResultRow = {
  id: string;
  status: string;
  site: StoredSite;
  answers: Record<string, StoredAnswer>;
  submitted_at?: string | null;
  is_public: boolean;
  public_location_name?: string | null;
  public_location_detail?: string | null;
  public_location_mode?: LocationMode | null;
  public_latitude?: number | null;
  public_longitude?: number | null;
  published_at?: string | null;
};

export type PublicResult = {
  id: string;
  module: ModuleId;
  moduleName: string;
  locationName: string;
  locationDetail: string;
  locationMode: LocationMode | null;
  latitude: number | null;
  longitude: number | null;
  reviewDate: string | null;
  publishedAt: string | null;
  score: number | null;
  counts: { pass: number; attention: number; unsure: number; notApplicable: number };
};

export function resultCounts(answers: Record<string, StoredAnswer> = {}) {
  const counts = { pass: 0, attention: 0, unsure: 0, notApplicable: 0 };
  Object.values(answers).forEach((answer) => {
    if (answer.result === "pass") counts.pass += 1;
    if (answer.result === "attention") counts.attention += 1;
    if (answer.result === "unsure") counts.unsure += 1;
    if (answer.result === "na") counts.notApplicable += 1;
  });
  return counts;
}

export function screeningScore(answers: Record<string, StoredAnswer> = {}) {
  const counts = resultCounts(answers);
  const determinate = counts.pass + counts.attention;
  return determinate ? Math.round((counts.pass / determinate) * 100) : null;
}

export function sanitizePublicResult(row: PublicResultRow): PublicResult {
  return {
    id: row.id,
    module: row.site.checkupType,
    moduleName: moduleNames[row.site.checkupType],
    locationName: row.public_location_name || "Reviewed location",
    locationDetail: row.public_location_detail || "",
    locationMode: row.public_location_mode || null,
    latitude: typeof row.public_latitude === "number" ? row.public_latitude : null,
    longitude: typeof row.public_longitude === "number" ? row.public_longitude : null,
    reviewDate: row.site.date || row.submitted_at || null,
    publishedAt: row.published_at || null,
    score: screeningScore(row.answers),
    counts: resultCounts(row.answers),
  };
}
