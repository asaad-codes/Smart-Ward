"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

function getPasswordStrength(password) {
  const pass = String(password || "").trim();

  if (!pass) {
    return {
      label: "",
      color: "#d6dbe3",
      width: "0%",
      bars: [false, false, false],
      canCreate: false,
      message: "",
    };
  }

  const easyPasswords = [
    "123", "1234", "12345", "123456", "1234567", "12345678",
    "1111", "111111", "0000", "000000", "password", "qwerty", "admin", "admin123",
  ];

  const lower = pass.toLowerCase();
  const repeatedChar = /^([a-zA-Z0-9])\1+$/.test(pass);
  const sequential =
    /^[0-9]+$/.test(pass) &&
    ("1234567890".includes(pass) || "0987654321".includes(pass));

  if (
    pass.length < 4 ||
    easyPasswords.includes(lower) ||
    repeatedChar ||
    sequential
  ) {
    return {
      label: "EASY",
      color: "#dc2626",
      width: "33%",
      bars: [true, false, false],
      canCreate: false,
      message: "Easy password is not allowed. Use moderate or strong password.",
    };
  }

  let score = 0;

  if (pass.length >= 4) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score >= 4) {
    return {
      label: "STRONG",
      color: "#0b7a58",
      width: "100%",
      bars: [true, true, true],
      canCreate: true,
      message: "Strong password. Account can be created.",
    };
  }

  return {
    label: "MODERATE",
    color: "#0b7a58",
    width: "66%",
    bars: [true, true, false],
    canCreate: true,
    message: "Moderate password. Account can be created.",
  };
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const inputStyle = {
    width: "100%",
    height: "42px",
    borderRadius: "13px",
    border: "1px solid #dbe3ed",
    background: "#f8fafc",
    padding: "0 14px",
    fontSize: "13px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "10px",
    fontWeight: "800",
    color: "#475569",
    marginBottom: "6px",
    letterSpacing: "1px",
  };

  const errorStyle = {
    color: "#dc2626",
    fontSize: "11px",
    marginTop: "5px",
    marginBottom: "0",
    fontWeight: "600",
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "", general: "" });
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Medical email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.role.trim()) {
      newErrors.role = "Professional role is required";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!strength.canCreate) {
      newErrors.password =
        "Easy password is not allowed. Please use moderate or strong password.";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      setLoading(true);

      // Sahi aur optimized payload backend ke liye
      const payload = {
        name: form.fullName.trim(), // form.fullName ko lowercase 'name' me convert kiya jo backend ko chahiye
        email: form.email.trim().toLowerCase(),
        role: form.role,
        password: form.password,
      };

      // 127.0.0.1 use kiya loopback precision ke liye jo network error nahi dega
      const response = await axios.post("http://127.0.0.1:5000/api/auth/register", payload);

      if (response.data.success || response.status === 201) {
        toast.success("Account created successfully. Please login.");
        setTimeout(() => {
          router.push("/login");
        }, 700);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Agar backend se koi proper custom error message aaye (e.g., "User already exists")
      const backendMessage = error.response?.data?.message || "Connection failed. Make sure your backend is running.";
      setErrors({ general: backendMessage });
      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div
        style={{
          height: "54px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
          background: "rgba(255,255,255,0.58)",
          backdropFilter: "blur(14px)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "11px",
              background: "#0b4aa2",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "900",
              boxShadow: "0 10px 22px rgba(11,74,162,0.24)",
            }}
          >
            S
          </div>

          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "850",
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
                marginTop: "-2px",
              }}
            >
              Clinical Management Platform
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Help opened")}
          style={{
            height: "32px",
            padding: "0 13px",
            borderRadius: "999px",
            border: "1px solid #dbe3ed",
            background: "#ffffff",
            color: "#0b4aa2",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Help
        </button>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "14px 18px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "980px",
            height: "100%",
            maxHeight: "540px",
            background: "#ffffff",
            borderRadius: "26px",
            boxShadow: "0 26px 76px rgba(15, 23, 42, 0.13)",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            border: "1px solid rgba(255,255,255,0.9)",
          }}
        >
          {/* Left Panel */}
          <div
            style={{
              background:
                "linear-gradient(145deg, #063b86 0%, #0754ba 55%, #0b6bd3 100%)",
              color: "#ffffff",
              padding: "30px",
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
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.13)",
                top: "-70px",
                right: "-70px",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background: "rgba(125,211,252,0.18)",
                bottom: "-100px",
                left: "-95px",
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
                  fontWeight: "800",
                  marginBottom: "28px",
                }}
              >
                Secure Clinical Registration
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  lineHeight: "1.18",
                  margin: 0,
                  fontWeight: "850",
                  letterSpacing: "-0.8px",
                  maxWidth: "330px",
                }}
              >
                Create access for your medical workspace.
              </h1>

              <p
                style={{
                  marginTop: "18px",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#dbeafe",
                  maxWidth: "330px",
                }}
              >
                Register your clinical profile to manage patient records, wards,
                vitals, medications, and alerts in SmartWard.
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
                <div style={{ fontSize: "18px", fontWeight: "850" }}>Safe</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#dbeafe",
                    marginTop: "4px",
                    lineHeight: "1.5",
                  }}
                >
                  Protected account setup
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
                <div style={{ fontSize: "18px", fontWeight: "850" }}>Smart</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#dbeafe",
                    marginTop: "4px",
                    lineHeight: "1.5",
                  }}
                >
                  Role based access
                </div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div
            style={{
              padding: "24px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: "100%", maxWidth: "520px" }}>
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "5px 10px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#0b4aa2",
                    fontSize: "10px",
                    fontWeight: "850",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  New SmartWard User
                </div>

                <h1
                  style={{
                    color: "#0f172a",
                    fontSize: "27px",
                    margin: "0 0 6px 0",
                    fontWeight: "850",
                    letterSpacing: "-0.8px",
                  }}
                >
                  Create your account
                </h1>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    margin: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Complete your details to access the SmartWard system.
                </p>
              </div>

              {errors.general && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: "12px",
                    marginBottom: "10px",
                    fontWeight: "700",
                  }}
                >
                  {errors.general}
                </p>
              )}

              <form onSubmit={handleRegister}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "13px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>FULL NAME</label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Dr. Julian Moore"
                      disabled={loading}
                    />
                    {errors.fullName && (
                      <p style={errorStyle}>{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>MEDICAL EMAIL</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="j.moore@hospital.org"
                      disabled={loading}
                    />
                    {errors.email && <p style={errorStyle}>{errors.email}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>PROFESSIONAL ROLE</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      style={inputStyle}
                      disabled={loading}
                    >
                      <option value="">Select role</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="patient">Patient</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p style={errorStyle}>{errors.role}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>PASSWORD</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.password && (
                      <p style={errorStyle}>{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <p style={errorStyle}>{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>PASSWORD STRENGTH</label>

                    <div
                      style={{
                        height: "42px",
                        borderRadius: "13px",
                        background: "#f8fafc",
                        border: "1px solid #dbe3ed",
                        padding: "9px 12px",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "5px",
                        }}
                      >
                        {strength.bars.map((active, index) => (
                          <div
                            key={index}
                            style={{
                              height: "5px",
                              background: active ? strength.color : "#d6dbe3",
                              borderRadius: "10px",
                            }}
                          />
                        ))}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          color: strength.color,
                          fontWeight: "850",
                          minWidth: "68px",
                          textAlign: "right",
                        }}
                      >
                        {strength.label || "TYPE"}
                      </span>
                    </div>
                  </div>
                </div>

                {strength.message && (
                  <p
                    style={{
                      color: strength.color,
                      fontSize: "11px",
                      marginTop: "8px",
                      marginBottom: "0",
                      fontWeight: "700",
                    }}
                  >
                    {strength.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "44px",
                    border: "none",
                    borderRadius: "14px",
                    background: loading ? "#cccccc" : "#0b4aa2",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "850",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 14px 28px rgba(11, 74, 162, 0.24)",
                    marginTop: "16px",
                  }}
                >
                  {loading ? "Registering Workspace..." : "Create Account"}
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  marginTop: "14px",
                  marginBottom: 0,
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  style={{
                    color: "#0b4aa2",
                    fontWeight: "850",
                    textDecoration: "none",
                  }}
                >
                  Login
                </Link>
              </p>

              <p
                style={{
                  margin: "12px 0 0 0",
                  textAlign: "center",
                  fontSize: "10px",
                  color: "#94a3b8",
                  lineHeight: "1.5",
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