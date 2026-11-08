"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moduleNames, type LocationMode, type ModuleId } from "@/lib/public-results";

export type PublicationRow = {
  id: string;
  module: ModuleId;
  siteName: string;
  siteAddress: string;
  municipality: string;
  submittedAt: string;
  isPublic: boolean;
  locationName: string;
  locationDetail: string;
  locationMode: LocationMode;
  latitude: number | null;
  longitude: number | null;
};

function PublicationCard({ row }: { row: PublicationRow }) {
  const router = useRouter();
  const [locationName, setLocationName] = useState(row.locationName || row.siteName);
  const [locationDetail, setLocationDetail] = useState(row.locationDetail || (row.locationMode === "approximate" ? row.municipality : row.siteAddress));
  const [locationMode, setLocationMode] = useState<LocationMode>(row.locationMode);
  const [latitude, setLatitude] = useState<number | null>(row.latitude);
  const [longitude, setLongitude] = useState<number | null>(row.longitude);
  const [busy, setBusy] = useState<"geocode" | "publish" | "unpublish" | null>(null);
  const [message, setMessage] = useState("");

  async function geocode() {
    setBusy("geocode"); setMessage("");
    try {
      const response = await fetch("/dashboard/api/geocode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: locationDetail }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Location search failed.");
      setLatitude(data.latitude); setLongitude(data.longitude);
      setMessage(`Map point found: ${data.label}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Location search failed."); }
    finally { setBusy(null); }
  }

  async function save(publish: boolean) {
    setBusy(publish ? "publish" : "unpublish"); setMessage("");
    try {
      const response = await fetch(`/dashboard/api/publication/${row.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish, module: row.module, locationName, locationDetail, locationMode, latitude, longitude }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publication settings could not be saved.");
      setMessage(publish ? "Published to the public results dashboard." : "Removed from the public results dashboard.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Publication settings could not be saved."); }
    finally { setBusy(null); }
  }

  return <article className="publicationCard">
    <div className="publicationCardHead"><div><span>{moduleNames[row.module]}</span><strong>{row.siteName || "Unnamed checkup"}</strong><small>Submitted {new Date(row.submittedAt).toLocaleDateString()}</small></div><b className={row.isPublic ? "publishedBadge" : "privateBadge"}>{row.isPublic ? "PUBLIC" : "PRIVATE"}</b></div>
    <div className="publicationFields">
      <label>Public location name<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Name shown publicly" /></label>
      <label>Marker precision<select value={locationMode} onChange={(event) => { const mode = event.target.value as LocationMode; setLocationMode(mode); if (mode === "approximate" && row.municipality) setLocationDetail(row.municipality); }}><option value="approximate">Approximate / municipality</option><option value="exact">Exact location</option></select></label>
      <label className="wideField">Public location text<input value={locationDetail} onChange={(event) => { setLocationDetail(event.target.value); setLatitude(null); setLongitude(null); }} placeholder={locationMode === "exact" ? "Street address" : "Municipality, Rhode Island"} /></label>
      <div className="coordinateFields"><label>Latitude<input inputMode="decimal" value={latitude ?? ""} onChange={(event) => setLatitude(event.target.value ? Number(event.target.value) : null)} /></label><label>Longitude<input inputMode="decimal" value={longitude ?? ""} onChange={(event) => setLongitude(event.target.value ? Number(event.target.value) : null)} /></label></div>
    </div>
    <p className="privacyHint">Only the fields above, module, date, and calculated score can be public. Reviewer details, notes, and individual answers remain private.</p>
    {message && <p className="publicationMessage" role="status">{message}</p>}
    <div className="publicationActions"><button className="secondary" disabled={Boolean(busy) || !locationDetail} onClick={geocode}>{busy === "geocode" ? "Finding…" : "Find map point"}</button>{row.isPublic ? <button className="dangerButton" disabled={Boolean(busy)} onClick={() => save(false)}>{busy === "unpublish" ? "Removing…" : "Remove from public dashboard"}</button> : <button className="primary" disabled={Boolean(busy)} onClick={() => save(true)}>{busy === "publish" ? "Publishing…" : "Publish review"}</button>}</div>
  </article>;
}

export default function PublicationManager({ rows }: { rows: PublicationRow[] }) {
  if (!rows.length) return <p>No submitted checkups are available to publish.</p>;
  return <div className="publicationList">{rows.map((row) => <PublicationCard key={`${row.id}-${row.isPublic}`} row={row} />)}</div>;
}
