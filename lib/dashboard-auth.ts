import { createHmac, timingSafeEqual } from "node:crypto";

export const dashboardCookie = "accesscheckup_dashboard";

function secret() {
  return process.env.DASHBOARD_SESSION_SECRET || "";
}

export function dashboardConfigured() {
  return Boolean(process.env.DASHBOARD_PASSWORD && secret().length >= 32);
}

export function dashboardToken() {
  return createHmac("sha256", secret()).update("accesscheckup-dashboard-v1").digest("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validDashboardToken(value?: string) {
  return dashboardConfigured() && Boolean(value) && safeEqual(value || "", dashboardToken());
}
