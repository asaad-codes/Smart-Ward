"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    setSuccess("Reset link sent successfully to your email.");
    setEmail("");
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, #dbeafe 0%, transparent 34%), radial-gradient(circle at bottom right, #ccfbf1 0%, transparent 32%), #eef5fb",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              background: "#0b4aa2",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: "800",
              boxShadow: "0 10px 24px rgba(11,74,162,0.24)",
            }}
          >
            S
          </div>

          <div>
            <div
              style={{
                fontSize: "19px",
                fontWeight: "800",
                color: "#0b4aa2",
                letterSpacing: "-0.4px",
              }}
            >
              SmartWard
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                fontWeight: "600",
                marginTop: "-1px",
              }}
            >
              Clinical Management Platform
            </div>
          </div>
        </div>

        <Link
          href="/login"
          style={{
            fontSize: "13px",
            color: "#0b4aa2",
            fontWeight: "700",
            textDecoration: "none",
          }}
        >
          Back to Login
        </Link>
      </div>

      {/* Main Section */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "880px",
            height: "100%",
            maxHeight: "530px",
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            background: "#ffffff",
            borderRadius: "26px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 26px 76px rgba(15,23,42,0.13)",
          }}
        >
          {/* Left Panel */}
          <div
            style={{
              background:
                "linear-gradient(145deg, #063b86 0%, #0754ba 55%, #0b6bd3 100%)",
              color: "#ffffff",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.14)",
                top: "-70px",
                right: "-60px",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "rgba(125,211,252,0.18)",
                bottom: "-90px",
                left: "-80px",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "7px 13px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: "11px",
                  fontWeight: "700",
                  marginBottom: "28px",
                }}
              >
                Secure Account Recovery
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  lineHeight: "1.18",
                  margin: 0,
                  fontWeight: "800",
                  letterSpacing: "-0.8px",
                  maxWidth: "310px",
                }}
              >
                Recover access to your clinical workspace.
              </h1>

              <p
                style={{
                  marginTop: "18px",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#dbeafe",
                  maxWidth: "320px",
                }}
              >
                Enter your registered email address and SmartWard will guide you
                through a secure reset process.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "800" }}>Safe</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#dbeafe",
                    marginTop: "4px",
                    lineHeight: "1.5",
                  }}
                >
                  Protected recovery
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "800" }}>Fast</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#dbeafe",
                    marginTop: "4px",
                    lineHeight: "1.5",
                  }}
                >
                  Quick reset link
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div
            style={{
              padding: "34px 44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: "100%", maxWidth: "390px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "16px",
                  background: "#eff6ff",
                  color: "#0b4aa2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "18px",
                }}
              >
                🔐
              </div>

              <div
                style={{
                  display: "inline-flex",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background: "#eff6ff",
                  color: "#0b4aa2",
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Password Assistance
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  margin: "0 0 8px 0",
                  color: "#0f172a",
                  fontWeight: "800",
                  letterSpacing: "-0.8px",
                }}
              >
                Reset your password
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "0 0 24px 0",
                  lineHeight: "1.7",
                }}
              >
                Enter your email address and we will send a secure reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#475569",
                      marginBottom: "8px",
                      letterSpacing: "1px",
                    }}
                  >
                    EMAIL ADDRESS
                  </label>

                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      placeholder="name@clinical.com"
                      style={{
                        width: "100%",
                        height: "46px",
                        borderRadius: "14px",
                        border: error
                          ? "1px solid #ef4444"
                          : success
                          ? "1px solid #22c55e"
                          : "1px solid #dbe3ed",
                        background: "#f8fafc",
                        padding: "0 46px 0 15px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        fontSize: "16px",
                      }}
                    >
                      ✉️
                    </span>
                  </div>

                  {error && (
                    <p
                      style={{
                        color: "#dc2626",
                        fontSize: "12px",
                        marginTop: "7px",
                        marginBottom: 0,
                        fontWeight: "600",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  {success && (
                    <p
                      style={{
                        color: "#16a34a",
                        fontSize: "12px",
                        marginTop: "7px",
                        marginBottom: 0,
                        fontWeight: "600",
                      }}
                    >
                      {success}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    height: "46px",
                    border: "none",
                    borderRadius: "14px",
                    background: "#0b4aa2",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 14px 28px rgba(11, 74, 162, 0.24)",
                    marginTop: "4px",
                  }}
                >
                  Send Reset Link →
                </button>
              </form>

              <Link
                href="/login"
                style={{
                  display: "block",
                  width: "100%",
                  height: "44px",
                  lineHeight: "44px",
                  textAlign: "center",
                  borderRadius: "14px",
                  background: "#f1f5f9",
                  color: "#0b4aa2",
                  fontSize: "13px",
                  fontWeight: "800",
                  textDecoration: "none",
                  marginTop: "12px",
                  border: "1px solid #e2e8f0",
                  boxSizing: "border-box",
                }}
              >
                Back to Login
              </Link>

              <p
                style={{
                  margin: "18px 0 0 0",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#94a3b8",
                  lineHeight: "1.6",
                }}
              >
                Protected access for authorized SmartWard users only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}