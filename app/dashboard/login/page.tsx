import { dashboardConfigured } from "@/lib/dashboard-auth";
import Link from "next/link";

export default async function DashboardLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="dashboardShell loginShell"><section className="loginCard"><div className="eyebrow">PRIVATE AREA</div><h1>Dashboard access</h1><p>Enter the private dashboard password. Checkup participants do not need an account.</p>{!dashboardConfigured() && <div className="dashboardWarning">Set DASHBOARD_PASSWORD and DASHBOARD_SESSION_SECRET in Netlify before using this dashboard.</div>}{params.error && <div className="dashboardError">That password was not accepted.</div>}<form method="post" action="/api/dashboard/session"><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary" type="submit">Open dashboard</button></form><Link href="/">← Return to AccessCheckUp</Link></section></main>;
}
