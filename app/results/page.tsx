import type { Metadata } from "next";
import Link from "next/link";
import PublicResultsDashboard from "./PublicResultsDashboard";

export const metadata: Metadata = {
  title: "Public accessibility checkup results | AccessCheckUp",
  description: "Explore published AccessCheckUp screenings by location and accessibility module.",
};

export default function ResultsPage() {
  return <main className="resultsShell">
    <header className="resultsHeader"><Link href="/" className="resultsBrand">Access<span>CheckUp</span></Link><Link href="/" className="textButton">Start a check-up</Link></header>
    <section className="resultsHero"><div className="eyebrow">PUBLIC RESULTS</div><h1>Where access has been checked.</h1><p>Explore accessibility screenings that have been reviewed and approved for public display.</p></section>
    <PublicResultsDashboard />
    <section className="resultsMethod"><h2>How to read these results</h2><p>The quick-check score is the percentage of determinate checklist items marked “looks good.” Items marked “unsure,” “not applicable,” or left unanswered are excluded. These are preliminary screening results—not legal compliance determinations or complete accessibility audits.</p></section>
  </main>;
}
