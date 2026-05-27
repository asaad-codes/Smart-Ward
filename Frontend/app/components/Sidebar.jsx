"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function Sidebar({ user, role }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentRole = String(role || user?.role || "patient")
    .toLowerCase()
    .trim();

  const menuItems = useMemo(() => {
    const menus = {
      admin: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/patients", label: "Patients", icon: "👤" },
        { href: "/wards", label: "Wards", icon: "🏢" },
        { href: "/vitals", label: "Vitals", icon: "💓" },
        { href: "/medications", label: "Medications", icon: "💊" },
        { href: "/reports", label: "Reports", icon: "📄" },
        { href: "/ai-assistant", label: "AI Assistant", icon: "⚙️" },
      ],

      doctor: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/patients", label: "Patients", icon: "👤" },
        { href: "/wards", label: "Wards", icon: "🏢" },
        { href: "/vitals", label: "Vitals", icon: "💓" },
        { href: "/medications", label: "Medications", icon: "💊" },
        { href: "/reports", label: "Reports", icon: "📄" },
        { href: "/ai-assistant", label: "AI Assistant", icon: "⚙️" },
      ],

      nurse: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/vitals", label: "Vitals", icon: "💓" },
        { href: "/medications", label: "Medications", icon: "💊" },
        { href: "/ai-assistant", label: "AI Assistant", icon: "⚙️" },
      ],

      patient: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/patients", label: "Patients", icon: "👤" },
        { href: "/vitals", label: "Vitals", icon: "💓" },
        { href: "/medications", label: "Medications", icon: "💊" },
        { href: "/reports", label: "Report", icon: "📄" },
        { href: "/ai-assistant", label: "AI Assistant", icon: "⚙️" },
      ],
    };

    return menus[currentRole] || menus.patient;
  }, [currentRole]);

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkStyle = (href) => {
    const active = isActive(href);

    return {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      marginBottom: "10px",
      borderRadius: "16px",
      textDecoration: "none",
      background: active ? "#ffffff" : "transparent",
      color: active ? "#0b4aa2" : "#475569",
      fontWeight: active ? "700" : "500",
      fontSize: "18px",
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("smartwardUser");
    localStorage.removeItem("token");
    localStorage.removeItem("smartward_token");

    router.replace("/login");
  };

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

        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div>
        {currentRole !== "patient" && (
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
        )}

        <button
          onClick={handleLogout}
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