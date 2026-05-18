"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const linkStyle = (href) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    marginBottom: "10px",
    borderRadius: "16px",
    textDecoration: "none",
    background: pathname === href ? "#ffffff" : "transparent",
    color: pathname === href ? "#0b4aa2" : "#475569",
    fontWeight: pathname === href ? "700" : "500",
    fontSize: "18px",
  });

  const isPatientDetail = pathname.startsWith("/patients/") && pathname !== "/patients";

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "#eef3f8",
        borderRight: "1px solid #e5e7eb",
        padding: "18px 16px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#0b4aa2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "22px",
            }}
          >
            🏥
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0b4aa2",
              }}
            >
              SmartWard
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "1px",
                color: "#64748b",
              }}
            >
              CLINICAL PRECISION
            </div>
          </div>
        </div>

        <Link href="/dashboard" style={linkStyle("/dashboard")}>
          📊 Dashboard
        </Link>

        <Link href="/patients" style={{
          ...linkStyle("/patients"),
          background: pathname === "/patients" || isPatientDetail ? "#ffffff" : "transparent",
          color: pathname === "/patients" || isPatientDetail ? "#0b4aa2" : "#475569",
          fontWeight: pathname === "/patients" || isPatientDetail ? "700" : "500",
        }}>
          👤 Patients
        </Link>

        <Link href="/wards" style={linkStyle("/wards")}>
          🏢 Wards
        </Link>

        <Link href="/vitals" style={linkStyle("/vitals")}>
          💓 Vitals
        </Link>

        <Link href="/medications" style={linkStyle("/medications")}>
          💊 Medications
        </Link>

        <Link href="/ai-assistant" style={linkStyle("/ai-assistant")}>
          ⚙️ AI Assistant
        </Link>
      </div>

      <div>
        <button
          onClick={() => alert("Emergency alert triggered")}
          style={{
            width: "100%",
            border: "none",
            background: "#dc2626",
            color: "#fff",
            padding: "16px 18px",
            borderRadius: "16px",
            fontSize: "16px",
            fontWeight: "700",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          🚨 Emergency Alert
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("smartwardUser");
            router.push("/login");
          }}
          style={{
            width: "100%",
            border: "none",
            background: "#991b1b",
            color: "#fff",
            padding: "16px 18px",
            borderRadius: "16px",
            fontSize: "16px",
            fontWeight: "700",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}