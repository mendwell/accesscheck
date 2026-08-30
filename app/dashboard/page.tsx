import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dashboardCookie, validDashboardToken } from "@/lib/dashboard-auth";
import { supabaseRequest, type StoredAnswer, type StoredSite } from "@/lib/checkups";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

type Row = { id: string; status: string; site: StoredSite; answers: Record<string, StoredAnswer>; submitted_at?: string; created_at: string };
const moduleNames: Record<string, string> = { physical: "Likely physical barriers", event: "Event accessibility", digital: "Digital accessibility", voting: "Voting accessibility" };

export default async function Dashboard() {
  const jar = await cookies();
  if (!validDashboardToken(jar.get(dashboardCookie)?.value)) redirect("/dashboard/login");
  const response = await supabaseRequest("checkups?select=id,status,site,answers,submitted_at,created_at&order=created_at.desc&limit=5000");
  const rows = await response.json() as Row[];
  const submitted = rows.filter((row) => row.status === "submitted");
  const moduleCounts = submitted.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.site.checkupType]: (counts[row.site.checkupType] || 0) + 1 }), {});
  const issueCounts = new Map<string, { title: string; count: number }>();
  submitted.forEach((row) => Object.entries(row.answers || {}).forEach(([id, answer]) => { if (answer.result === "attention") { const key = `${row.site.checkupType}:${id}`; const old = issueCounts.get(key); issueCounts.set(key, { title: answer.questionTitle || id, count: (old?.count || 0) + 1 }); } }));
  const commonIssues = [...issueCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  const municipalities = submitted.filter((row) => row.site.checkupType === "voting" && row.site.municipality).reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.site.municipality]: (counts[row.site.municipality] || 0) + 1 }), {});
  const volunteers = submitted.filter((row) => row.site.volunteerHours);

  return <main className="dashboardShell"><header className="dashboardHeader"><div><div className="eyebrow">PRIVATE DASHBOARD</div><h1>Checkup results</h1><p>Contact information appears only in this protected view.</p></div><LogoutButton /></header>
    <section className="dashboardStats"><article><strong>{submitted.length}</strong><span>submitted checkups</span></article><article><strong>{rows.length - submitted.length}</strong><span>drafts</span></article><article><strong>{volunteers.length}</strong><span>volunteer-hour records</span></article></section>
    <section className="dashboardPanel"><h2>Submitted by module</h2><div className="barList">{Object.entries(moduleNames).map(([id, name]) => <div key={id}><span>{name}</span><strong>{moduleCounts[id] || 0}</strong></div>)}</div></section>
    <section className="dashboardGrid"><section className="dashboardPanel"><h2>Most common items needing attention</h2>{commonIssues.length ? <ol>{commonIssues.map((issue) => <li key={issue.title}><span>{issue.title}</span><strong>{issue.count}</strong></li>)}</ol> : <p>No submitted items are marked “needs attention” yet.</p>}</section><section className="dashboardPanel"><h2>RI voting surveys by municipality</h2>{Object.keys(municipalities).length ? <ol>{Object.entries(municipalities).sort((a,b) => b[1]-a[1]).map(([name,count]) => <li key={name}><span>{name}</span><strong>{count}</strong></li>)}</ol> : <p>No submitted Rhode Island voting surveys yet.</p>}</section></section>
    <section className="dashboardPanel"><h2>Volunteer or service hours</h2><div className="tableWrap"><table><thead><tr><th>Name</th><th>Email</th><th>Checkup</th><th>Site</th><th>Date</th></tr></thead><tbody>{volunteers.map((row) => <tr key={row.id}><td>{row.site.reviewer || "Not provided"}</td><td>{row.site.email || "Not provided"}</td><td>{moduleNames[row.site.checkupType]}</td><td>{row.site.name || "Not provided"}</td><td>{row.site.date || "Not provided"}</td></tr>)}</tbody></table></div></section>
    <section className="dashboardPanel"><h2>Recent submissions</h2><div className="tableWrap"><table><thead><tr><th>Date</th><th>Module</th><th>Site or subject</th><th>Location</th><th>Reviewer</th></tr></thead><tbody>{submitted.slice(0,25).map((row) => <tr key={row.id}><td>{new Date(row.submitted_at || row.created_at).toLocaleDateString()}</td><td>{moduleNames[row.site.checkupType]}</td><td>{row.site.name || "Not provided"}</td><td>{row.site.municipality || row.site.address || "Not provided"}</td><td>{row.site.reviewer || "Not provided"}</td></tr>)}</tbody></table></div></section>
  </main>;
}
