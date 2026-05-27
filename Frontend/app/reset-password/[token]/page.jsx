"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const AUTH_API = `${API_BASE_URL}/auth`;

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Reset token is missing");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${AUTH_API}/reset-password/${token}`, {
        password,
      });

      setSuccess(response.data.message || "Password reset successfully");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const statusText = err.response
        ? `Status: ${err.response.status}`
        : "Network Error";

      setError(serverMessage || `${statusText} - Unable to reset password`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #dbeafe 0%, transparent 34%), radial-gradient(circle at bottom right, #ccfbf1 0%, transparent 32%), #eef5fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: "rgba(255,255,255,0.65)",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              background: "#0b4aa2",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
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
              }}
            >
              SmartWard
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                fontWeight: "600",
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

      <div
        style={{
          minHeight: "calc(100vh - 58px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "880px",
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            background: "#ffffff",
            borderRadius: "26px",
            overflow: "hidden",
            boxShadow: "0 26px 76px rgba(15,23,42,0.13)",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(145deg, #063b86 0%, #0754ba 55%, #0b6bd3 100%)",
              color: "#ffffff",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                width: "fit-content",
                padding: "7px 13px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "26px",
              }}
            >
              Secure Password Reset
            </div>

            <h1
              style={{
                fontSize: "31px",
                lineHeight: "1.18",
                margin: 0,
                fontWeight: "800",
                letterSpacing: "-0.8px",
              }}
            >
              Create a new password for your account.
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "14px",
                lineHeight: "1.8",
                color: "#dbeafe",
              }}
            >
              Enter your new password below. After successful reset, you will be
              redirected to the login page.
            </p>
          </div>

          <div
            style={{
              padding: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                🔑
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
                New Password
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  margin: "0 0 8px 0",
                  color: "#0f172a",
                  fontWeight: "800",
                }}
              >
                Reset Password
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "0 0 24px 0",
                  lineHeight: "1.7",
                }}
              >
                Choose a strong password for your SmartWard account.
              </p>

              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: "14px" }}>
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
                    NEW PASSWORD
                  </label>

                  <input
                    type="password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="Enter new password"
                    style={{
                      width: "100%",
                      height: "46px",
                      borderRadius: "14px",
                      border: "1px solid #dbe3ed",
                      background: "#f8fafc",
                      padding: "0 15px",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

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
                    CONFIRM PASSWORD
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="Confirm new password"
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
                      padding: "0 15px",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

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
                        fontWeight: "700",
                      }}
                    >
                      {success}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    border: "none",
                    borderRadius: "14px",
                    background: loading ? "#93c5fd" : "#0b4aa2",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 14px 28px rgba(11,74,162,0.24)",
                  }}
                >
                  {loading ? "Resetting..." : "Reset Password →"}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 