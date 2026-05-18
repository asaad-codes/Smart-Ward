"use client";

import { useAppContext } from "../context/AppContext";

export default function CriticalAlertModal() {
  const { isEmergencyOpen, closeEmergency } = useAppContext();

  if (!isEmergencyOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "92%",
          background: "#fff",
          borderRadius: "22px",
          padding: "28px",
          boxShadow: "0 20px 50px rgba(15,23,42,0.22)",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>🚨</div>

        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: "28px",
            color: "#991b1b",
          }}
        >
          Critical Alert
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: "1.7",
            color: "#475569",
          }}
        >
          Emergency alert has been triggered across the system. Please review
          critical patients and pending urgent actions immediately.
        </p>

        <button
          onClick={closeEmergency}
          style={{
            marginTop: "22px",
            border: "none",
            background: "#dc2626",
            color: "#fff",
            padding: "14px 22px",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "16px",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}