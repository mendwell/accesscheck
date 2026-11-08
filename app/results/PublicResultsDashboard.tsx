"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { moduleNames, type ModuleId, type PublicResult } from "@/lib/public-results";

const moduleColors: Record<ModuleId, string> = { physical: "#b89ee0", event: "#82b6d9", digital: "#d0ae78", voting: "#d891a1" };
const moduleCodes: Record<ModuleId, string> = { physical: "P", event: "E", digital: "D", voting: "V" };

function ResultsMap({ results }: { results: PublicResult[] }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!host.current) return;
      const L = await import("leaflet");
      if (cancelled || !host.current) return;
      map.current?.remove();
      const nextMap = L.map(host.current, { scrollWheelZoom: false }).setView([41.68, -71.58], 9);
      map.current = nextMap;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(nextMap);
      const bounds: Array<[number, number]> = [];
      results.forEach((result) => {
        if (result.latitude === null || result.longitude === null) return;
        const point: [number, number] = [result.latitude, result.longitude];
        bounds.push(point);
        const score = result.score === null ? "Not scored" : `${result.score}% quick-check score`;
        const icon = L.divIcon({
          className: "accessibleMapMarker",
          html: `<span>${moduleCodes[result.module]}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = result.locationName;
        const details = document.createElement("p");
        details.textContent = `${result.moduleName} · ${score}`;
        popup.append(title, details);
        L.marker(point, { icon, title: `${result.moduleName}: ${result.locationName}` }).bindPopup(popup).addTo(nextMap);
      });
      if (bounds.length === 1) nextMap.setView(bounds[0], 13);
      if (bounds.length > 1) nextMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
    renderMap();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, [results]);

  return <div ref={host} className="resultsMap" role="region" aria-label="Map of published accessibility checkups" />;
}

export default function PublicResultsDashboard() {
  const [results, setResults] = useState<PublicResult[]>([]);
  const [filter, setFilter] = useState<"all" | ModuleId>("all");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch("/api/public-results").then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { results: PublicResult[] };
      setResults(data.results);
      setState("ready");
    }).catch(() => setState("error"));
  }, []);

  const visible = useMemo(() => filter === "all" ? results : results.filter((result) => result.module === filter), [filter, results]);
  const mapped = visible.filter((result) => result.latitude !== null && result.longitude !== null);
  const scored = visible.filter((result) => result.score !== null);
  const average = scored.length ? Math.round(scored.reduce((sum, result) => sum + (result.score || 0), 0) / scored.length) : null;
  const attention = visible.reduce((sum, result) => sum + result.counts.attention, 0);

  if (state === "loading") return <div className="resultsStatus" role="status">Loading published results…</div>;
  if (state === "error") return <div className="resultsStatus resultsError" role="alert">The public results could not be loaded right now. Please try again later.</div>;

  return <>
    <nav className="resultsFilters" aria-label="Filter results by module"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All modules</button>{(Object.entries(moduleNames) as Array<[ModuleId, string]>).map(([id, name]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{name}</button>)}</nav>
    <section className="publicStats" aria-label="Published results summary"><article><strong>{visible.length}</strong><span>published checkups</span></article><article><strong>{mapped.length}</strong><span>mapped locations</span></article><article><strong>{average === null ? "—" : `${average}%`}</strong><span>average quick-check score</span></article><article><strong>{attention}</strong><span>items needing attention</span></article></section>
    {mapped.length ? <ResultsMap results={mapped} /> : <div className="emptyMap"><strong>No mapped results in this view yet.</strong><span>Published digital checkups may appear in the list without a physical map point.</span></div>}
    <div className="mapLegend" aria-label="Map marker abbreviations">{(Object.entries(moduleNames) as Array<[ModuleId, string]>).map(([id, name]) => <span key={id}><i>{moduleCodes[id]}</i>{name}</span>)}</div>
    <section className="resultsList" aria-labelledby="published-results-heading"><div className="resultsListHead"><h2 id="published-results-heading">Published checkups</h2><span>{visible.length} result{visible.length === 1 ? "" : "s"}</span></div>{visible.length ? <div className="resultCards">{visible.map((result) => <article key={result.id} className="resultCard"><div><span className="resultModule" style={{ color: moduleColors[result.module] }}>{result.moduleName}</span><h3>{result.locationName}</h3><p>{result.locationDetail || (result.locationMode === "approximate" ? "Approximate location" : "Location approved for display")}</p><small>Reviewed {result.reviewDate ? new Date(`${result.reviewDate}`.includes("T") ? result.reviewDate : `${result.reviewDate}T12:00:00`).toLocaleDateString() : "date not provided"}{result.locationMode === "approximate" ? " · Approximate marker" : ""}</small></div><div className="resultScore"><strong>{result.score === null ? "—" : `${result.score}%`}</strong><span>quick-check score</span><small>{result.counts.pass} looked good · {result.counts.attention} need attention</small></div></article>)}</div> : <div className="resultsEmpty">No published checkups match this module yet.</div>}</section>
  </>;
}
