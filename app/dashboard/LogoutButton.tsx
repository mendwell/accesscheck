"use client";

export default function LogoutButton() {
  return <button className="secondary" onClick={async () => { await fetch("/api/dashboard/session", { method: "DELETE" }); location.href = "/dashboard/login"; }}>Sign out</button>;
}
