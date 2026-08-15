"use client";

import { useEffect, useMemo, useState } from "react";

type Result = "pass" | "attention" | "unsure" | "na";
type Answer = { result?: Result; note?: string };
type Check = { id: string; title: string; prompt: string; measure?: string; why?: string; critical?: boolean };
type Section = { id: string; name: string; short: string; intro: string; checks: Check[] };

const sections: Section[] = [
  {
    id: "parking", name: "Parking", short: "Park",
    intro: "Begin at the parking space or passenger drop-off most likely to be used by a disabled visitor.",
    checks: [
      { id: "p1", title: "Accessible space is provided", prompt: "Is at least one marked accessible parking space available near the accessible entrance?", why: "People need a safe place to transfer from a vehicle and begin the accessible route.", critical: true },
      { id: "p2", title: "Van space is identified", prompt: "Is at least one accessible space marked “Van Accessible”?", measure: "Look for a mounted accessibility sign plus a van designation.", critical: true },
      { id: "p3", title: "Space and aisle are wide enough", prompt: "Does the space have a clearly marked access aisle beside it? An access aisle is usually painted with hatching to deter parking.", measure: "Quick check: the aisle should be at least 5 ft wide; a van aisle is typically 8 ft, or 5 ft beside an 11 ft van space." },
      { id: "p4", title: "Surface is firm and level", prompt: "Are the parking space and access aisle stable (preferably paved), slip-resistant, and nearly level?", measure: "A 2% level bubble or digital reading is the quick maximum-slope check." },
      { id: "p5", title: "Aisle joins the route", prompt: "Can someone leave the access aisle without entering traffic and immediately reach the accessible route? How difficult is it to get from the parking space to the route?", critical: true },
    ],
  },
  {
    id: "arrival", name: "Arrival route", short: "Route", 
    intro: "Follow the actual path from parking or drop-off to the entrance. Look at the whole trip, not an isolated sidewalk segment.",
    checks: [
      { id: "a1", title: "Continuous step-free route", prompt: "Is there a continuous route to the entrance with no stairs, curbs, or abrupt level changes?", critical: true },
      { id: "a2", title: "Route is wide enough", prompt: "Is the clear walking surface generally at least 36 inches wide?", measure: "Measure the narrowest point, allowing only short, limited pinch points." },
      { id: "a3", title: "Surface is usable", prompt: "Is the route firm, stable, slip-resistant, and free of broken pavement, loose gravel, or large gaps?" },
      { id: "a4", title: "Slope is manageable", prompt: "Is the route gentle, or properly built as a ramp where it is steeper?", measure: "Walking route: 1:20 (5%) max. Ramp: 1:12 (8.33%) max, with landings and handrails where required." },
      { id: "a5", title: "Head and cane clearance", prompt: "Is the route free of low branches, signs, and wall-mounted objects that could be head or cane hazards?", measure: "Overhead clearance: 80 in minimum. Objects with leading edges 27–80 in high should not project more than 4 in." },
    ],
  },
  {
    id: "entrance", name: "Entrance", short: "Entry",
    intro: "Check the entrance a visitor is expected to use, including the doorway, hardware (the door handle), threshold, and space on both sides.",
    checks: [
      { id: "e1", title: "Accessible entrance is obvious", prompt: "Is the main entrance accessible, or do clear signs direct people to an equally usable accessible entrance?", critical: true },
      { id: "e2", title: "Door opening is clear", prompt: "Does at least one door provide a clear opening of 32 inches or more?", measure: "Open the door 90°. Measure from the door face to the stop—not jamb to jamb.", critical: true },
      { id: "e3", title: "Threshold is low", prompt: "Is the threshold 1/2 inch high or less, with no abrupt edge over 1/4 inch?", measure: "Use a small tape measure at the highest point." },
      { id: "e4", title: "Hardware is easy to use", prompt: "Can the latch or handle be operated with one hand without tight grasping, pinching, or twisting?" },
      { id: "e5", title: "Door can be opened", prompt: "Can a visitor approach, open, and pass through the door without excessive force or the door closing too quickly?", why: "A compliant-width door can still be unusable when maneuvering space or opening force is poor." },
    ],
  },
  {
    id: "restrooms", name: "Restrooms", short: "Toilet", 
    intro: "Check one public restroom intended to be accessible. If several serve the same area, note which one you reviewed.",
    checks: [
      { id: "r1", title: "Accessible restroom is available", prompt: "Is at least one accessible public restroom available, with direction signs if needed?", critical: true },
      { id: "r2", title: "Doorway and route work", prompt: "Is there a step-free route and at least 32 inches of clear door opening into the restroom?", measure: "Check mats, trash cans, and stored items as well as the permanent doorway." },
      { id: "r3", title: "Room has turning space", prompt: "Is there enough clear floor area for a wheelchair to turn and approach the fixtures?", measure: "Quick check: look for a 60 in turning circle or a usable T-shaped turning space." },
      { id: "r4", title: "Toilet transfer space is clear", prompt: "Is there clear space beside the toilet, with no trash can or fixture blocking a side transfer?", critical: true },
      { id: "r5", title: "Grab bars are present", prompt: "Are secure grab bars installed behind and beside the toilet, and free of obstructions?", critical: true },
      { id: "r6", title: "Sink and controls are reachable", prompt: "Can a wheelchair user approach the sink, use the faucet, soap, and hand-drying equipment?", measure: "Quick reach check: operable parts should generally be no higher than 48 in; pipes below the sink should be protected." },
    ],
  },
  {
    id: "services", name: "Access to services", short: "Service", 
    intro: "Travel from the entrance to the primary service, transaction, meeting, dining, or waiting area a visitor uses.",
    checks: [
      { id: "s1", title: "Services are on an accessible route", prompt: "Can a visitor reach the primary goods, services, and public spaces without stairs or blocked aisles?", critical: true },
      { id: "s2", title: "Interior route stays clear", prompt: "Are aisles generally at least 36 inches wide and free of furniture, displays, cords, or stored items?" },
      { id: "s3", title: "A usable service surface exists", prompt: "Is there a lowered counter, table, or equivalent way for a seated visitor to complete the main transaction?", measure: "A common quick check is a counter segment no higher than 36 in, or an accessible table with knee space." },
      { id: "s4", title: "Seating choices are inclusive", prompt: "Where seating is offered, are wheelchair spaces integrated with companion seating and tables usable by seated visitors?" },
      { id: "s5", title: "Controls and information are reachable", prompt: "Are check-in devices, dispensers, buttons, forms, and other essentials within reach and usable without tight grasping?", measure: "Quick reach check: highest operable part generally 48 in maximum when the approach is clear." },
    ],
  },
];

const labels: Record<Result, string> = { pass: "Looks good", attention: "Needs attention", unsure: "Not sure", na: "Not applicable" };

export default function Home() {
  const [screen, setScreen] = useState<"welcome" | "assessment" | "summary">("welcome");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [site, setSite] = useState({ name: "", address: "", reviewer: "", date: new Date().toISOString().slice(0, 10) });
  const [hydrated, setHydrated] = useState(false);
  const allChecks = useMemo(() => sections.flatMap((s) => s.checks), []);
  const completed = allChecks.filter((q) => answers[q.id]?.result).length;
  const current = sections[sectionIndex];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("access-check-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setSite(parsed.site || site);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("access-check-draft", JSON.stringify({ answers, site }));
  }, [answers, site, hydrated]);

  function setResult(id: string, result: Result) {
    setAnswers((old) => ({ ...old, [id]: { ...old[id], result } }));
  }

  function reset() {
    if (!confirm("Start a new assessment? This clears the current draft on this device.")) return;
    setAnswers({});
    setSite({ name: "", address: "", reviewer: "", date: new Date().toISOString().slice(0, 10) });
    setSectionIndex(0);
    setScreen("welcome");
    localStorage.removeItem("access-check-draft");
  }

  function exportAssessment() {
    const rows = allChecks.map((q) => ({ item: q.title, result: labels[answers[q.id]?.result || "unsure"], note: answers[q.id]?.note || "" }));
    const file = new Blob([JSON.stringify({ site, completedAt: new Date().toISOString(), results: rows }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `${site.name || "accessibility-assessment"}-${site.date}.json`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!hydrated) return <main className="loading">Preparing your field check…</main>;

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("welcome")} aria-label="AccessCheckUp home"><span>AC</span> AccessCheckUp</button>
        {screen !== "welcome" && <button className="textButton" onClick={reset}>New check</button>}
      </header>

      {screen === "welcome" && (
        <section className="welcome">
          <div className="eyebrow">QUICK 20-MINUTE SITE CHECK-UP</div>
          <h1>Notice barriers.<br />Improve access.</h1>
          <p className="lede">A guided tour of a basic assessment of physical barriers to parking, arrival, entrance, restrooms, and access to services- written for people who are new to accessibility reviews.</p>
          <div className="notice"><strong>This is a preliminary screening tool.</strong><span>It helps identify likely physical barriers to access. It is not a full ADA compliance determination or legal opinion.</span></div>
          <div className="siteForm">
            <label>Site name<input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} placeholder="Community Center" /></label>
            <label>Address or location<input value={site.address} onChange={(e) => setSite({ ...site, address: e.target.value })} placeholder="123 Main Street" /></label>
            <div className="fieldRow">
              <label>Reviewer<input value={site.reviewer} onChange={(e) => setSite({ ...site, reviewer: e.target.value })} placeholder="Your name" /></label>
              <label>Date<input type="date" value={site.date} onChange={(e) => setSite({ ...site, date: e.target.value })} /></label>
            </div>
          </div>
          <button className="primary" onClick={() => { setScreen("assessment"); setSectionIndex(0); }}>{completed ? "Continue draft" : "Start the check-up"}<span>→</span></button>
          <div className="bring"><span>Bring</span><b>Tape measure</b><b>Phone level</b><b>Camera</b></div>
        </section>
      )}

      {screen === "assessment" && (
        <section className="assessment">
          <div className="progressMeta"><span>{completed} of {allChecks.length} checked</span><span>{Math.round((completed / allChecks.length) * 100)}%</span></div>
          <div className="progress"><i style={{ width: `${(completed / allChecks.length) * 100}%` }} /></div>
          <nav className="steps" aria-label="Assessment sections">
            {sections.map((s, i) => <button key={s.id} className={i === sectionIndex ? "active" : i < sectionIndex ? "done" : ""} onClick={() => setSectionIndex(i)}><span>{i < sectionIndex ? "✓" : i + 1}</span>{s.short}</button>)}
          </nav>
          <div className="sectionHead"><div><div className="eyebrow">SECTION {sectionIndex + 1} OF {sections.length}</div><h2>{current.name}</h2></div><div className="sectionNumber">0{sectionIndex + 1}</div></div>
          <p className="intro">{current.intro}</p>
          <div className="checks">
            {current.checks.map((q, index) => {
              const answer = answers[q.id] || {};
              return <article className={`checkCard ${answer.result || ""}`} key={q.id}>
                <div className="questionTop"><span className="questionNumber">{sectionIndex + 1}.{index + 1}</span>{q.critical && <span className="priority">Priority check</span>}</div>
                <h3>{q.title}</h3><p>{q.prompt}</p>
                {(q.measure || q.why) && <details><summary>Quick guidance</summary><div>{q.measure || q.why}</div></details>}
                <fieldset><legend>Choose a result for {q.title}</legend>
                  {(["pass", "attention", "unsure", "na"] as Result[]).map((r) => <button type="button" key={r} className={answer.result === r ? "selected" : ""} onClick={() => setResult(q.id, r)}><span>{r === "pass" ? "✓" : r === "attention" ? "!" : r === "unsure" ? "?" : "–"}</span>{labels[r]}</button>)}
                </fieldset>
                <label className="noteLabel">Note or measurement (optional)<textarea value={answer.note || ""} onChange={(e) => setAnswers((old) => ({ ...old, [q.id]: { ...old[q.id], note: e.target.value } }))} placeholder="e.g., doorway measured 29 in" /></label>
              </article>;
            })}
          </div>
          <div className="sectionNav">
            <button className="secondary" disabled={sectionIndex === 0} onClick={() => { setSectionIndex(sectionIndex - 1); scrollTo(0, 0); }}>← Back</button>
            <button className="primary" onClick={() => { if (sectionIndex < sections.length - 1) { setSectionIndex(sectionIndex + 1); scrollTo(0, 0); } else { setScreen("summary"); scrollTo(0, 0); } }}>{sectionIndex === sections.length - 1 ? "View summary" : "Next section"}<span>→</span></button>
          </div>
        </section>
      )}

      {screen === "summary" && (() => {
        const issues = allChecks.filter((q) => answers[q.id]?.result === "attention");
        const unsure = allChecks.filter((q) => answers[q.id]?.result === "unsure" || !answers[q.id]?.result);
        const passes = allChecks.filter((q) => answers[q.id]?.result === "pass");
        return <section className="summaryPage">
          <div className="eyebrow">FIELD REVIEW SUMMARY</div><h1>{site.name || "Site assessment"}</h1><p className="summaryMeta">{site.address || "No address entered"} · {site.date}</p>
          <div className="scoreGrid"><div className="issueScore"><strong>{issues.length}</strong><span>need attention</span></div><div><strong>{unsure.length}</strong><span>not sure / incomplete</span></div><div><strong>{passes.length}</strong><span>look good</span></div></div>
          <div className="summaryNotice"><strong>What this means</strong><p>Items marked “needs attention” are good candidates for closer review and barrier-removal planning. “Looks good” means no obvious barrier was found during this quick check—not that full compliance was verified.</p></div>
          <h2>Items to follow up</h2>
          {issues.length === 0 ? <div className="empty">No items are marked “needs attention.” Review the uncertain or unanswered checks before closing the assessment.</div> : <div className="issueList">{issues.map((q) => <article key={q.id}><span>!</span><div><h3>{q.title}</h3><p>{answers[q.id]?.note || q.prompt}</p></div></article>)}</div>}
          {unsure.length > 0 && <details className="uncertain"><summary>{unsure.length} uncertain or incomplete checks</summary><ul>{unsure.map((q) => <li key={q.id}>{q.title}</li>)}</ul></details>}
          <div className="summaryActions"><button className="primary" onClick={exportAssessment}>Export results <span>↓</span></button><button className="secondary" onClick={() => window.print()}>Print / save PDF</button><button className="textButton" onClick={() => setScreen("assessment")}>Return to assessment</button></div>
          <p className="sourceNote">Adapted as a preliminary screening aid from the 2010 ADA Standards-based “ADA Checklist for Existing Facilities” and U.S. Department of Justice polling place guidance. Consult the full standards and a qualified accessibility professional for compliance decisions.</p>
        </section>;
      })()}
      <footer><span>AccessCheck</span><p>Quick screening for more welcoming places.</p></footer>
    </main>
  );
}
