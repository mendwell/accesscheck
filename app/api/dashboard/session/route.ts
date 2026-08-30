import { dashboardConfigured, dashboardCookie, dashboardToken, safeEqual } from "@/lib/dashboard-auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!dashboardConfigured()) return Response.json({ error: "Private dashboard access is not configured." }, { status: 503 });
  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!safeEqual(password, process.env.DASHBOARD_PASSWORD || "")) return Response.redirect(new URL("/dashboard/login?error=1", request.url), 303);
  const jar = await cookies();
  jar.set(dashboardCookie, dashboardToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/dashboard", maxAge: 60 * 60 * 8 });
  return Response.redirect(new URL("/dashboard", request.url), 303);
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(dashboardCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/dashboard", maxAge: 0 });
  return Response.json({ ok: true });
}
