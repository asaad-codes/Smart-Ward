"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../lib/storage";

export default function Topbar() {
  const [user, setUser] = useState({
    fullName: "Clinical User",
    role: "SmartWard User",
  });

  useEffect(() => {
    const savedUserRaw = localStorage.getItem(STORAGE_KEYS.USER);

    if (!savedUserRaw) return;

    try {
      const savedUser = JSON.parse(savedUserRaw);

      setUser({
        fullName: savedUser.fullName || "Clinical User",
        role: savedUser.role || "SmartWard User",
      });
    } catch {
      setUser({
        fullName: "Clinical User",
        role: "SmartWard User",
      });
    }
  }, []);

  return (
    <header
      style={{
        height: "42px",
        background: "#ffffff",
        borderBottom: "1px solid #e5edf6",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 18px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "999px",
          padding: "5px 12px 5px 6px",
          boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#0b4aa2",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          {user.fullName?.charAt(0) || "U"}
        </div>

        <div style={{ lineHeight: 1.1 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            {user.fullName}
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            {user.role}
          </div>
        </div>
      </div>
    </header>
  );
}