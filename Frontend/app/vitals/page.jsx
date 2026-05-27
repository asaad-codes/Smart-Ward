"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const VITAL_API = `${API_BASE_URL}/vital`;
const PATIENT_API = `${API_BASE_URL}/patient`; 

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("smartward_token");
}

function getStoredUser() {
  if (typeof window === "undefined") return null;

  const user =
    localStorage.getItem("smartwardUser") || localStorage.getItem("user");

  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function authConfig() {
  return {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  };
}

function formatTime(dateValue) {
  if (!dateValue) return "Just now";

  return new Date(dateValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapPatient(patient) {
  return {
    id: String(patient._id || patient.id),
    name: patient.name || "Unnamed Patient",
    age: patient.age || "",
    disease: patient.disease || "",
    ward: patient.ward || "",
    bed: patient.bed || "",
    gender: patient.gender || "",
    status: patient.status || "STABLE",
  };
}

function mapVital(vital) {
  const patientObj =
    vital.patient && typeof vital.patient === "object" ? vital.patient : null;

  return {
    id: vital._id || vital.id,
    heartRate: vital.heartRate || 0,
    bp: vital.bp || "120/80",
    temp: vital.temp || 36.5,
    spo2: vital.spo2 || 98,
    notes: vital.notes || "Vitals logged successfully.",
    status: vital.status || "STABLE",
    recordedBy: vital.recordedBy?.name || "SmartWard Staff",
    createdAt: vital.createdAt,

    patientId: patientObj?._id || vital.patient || "",
    patientName:
      patientObj?.name ||
      (typeof vital.patient === "string" ? vital.patient : "Unknown Patient"),
    patientWard: patientObj?.ward || "",
    patientBed: patientObj?.bed || "",
  };
}

function getStatusColor(status) {
  if (status === "CRITICAL") return "#cf171d";
  if (status === "HIGH") return "#b91c1c";
  if (status === "LOW") return "#f59e0b";
  return "#047857";
}

export default function VitalsPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAllLogs, setShowAllLogs] = useState(false);

  const [form, setForm] = useState({
    patient: "",
    heartRate: "",
    bp: "120/80",
    temp: "36.5",
    spo2: "98",
    notes: "",
  });

  const isPatient = role === "patient";
  const canManage = role === "admin" || role === "doctor" || role === "nurse";
  const canSelectPatients = role === "admin" || role === "doctor";

  const fetchPatientsForDropdown = async (currentRole) => {
    if (currentRole !== "admin" && currentRole !== "doctor") return;

    try {
      const response = await axios.get(`${PATIENT_API}/getpatients`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapPatient)
        : [];

      setPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patients.");
    }
  };

  const fetchVitals = async () => {
    try {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      const currentRole = String(storedUser.role || "").toLowerCase().trim();

      setRole(currentRole);
      setLoading(true);

      if (currentRole === "patient") {
        const response = await axios.get(`${VITAL_API}/myvitals`, authConfig());

        const data = Array.isArray(response.data?.data)
          ? response.data.data.map(mapVital)
          : [];

        setLogs(data);
        return;
      }

      if (
        currentRole !== "admin" &&
        currentRole !== "doctor" &&
        currentRole !== "nurse"
      ) {
        toast.error("You are not allowed to access vitals.");
        router.push("/dashboard");
        return;
      }

      const response = await axios.get(`${VITAL_API}/getvitals`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapVital)
        : [];

      setLogs(data);
      await fetchPatientsForDropdown(currentRole);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch vitals.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, []);

  const latestVital = logs[0];

  const latestHeartRate = latestVital?.heartRate || 72;
  const latestBP = latestVital?.bp || "120/80";
  const latestTemp = latestVital?.temp || 36.5;
  const latestSpo2 = latestVital?.spo2 || 98;
  const latestStatus = latestVital?.status || "STABLE";

  const liveStatus = useMemo(() => {
    const hr = Number(form.heartRate || latestHeartRate);
    const temp = Number(form.temp || latestTemp);
    const spo2 = Number(form.spo2 || latestSpo2);

    if (hr > 130 || hr < 45 || temp >= 40 || spo2 < 90) return "CRITICAL";
    if (hr > 100 || temp >= 38 || spo2 < 94) return "HIGH";
    if (hr < 60) return "LOW";
    return "STABLE";
  }, [
    form.heartRate,
    form.temp,
    form.spo2,
    latestHeartRate,
    latestTemp,
    latestSpo2,
  ]);

  const statusColor = getStatusColor(liveStatus || latestStatus);

  const totalLogs = logs.length;
  const criticalLogs = logs.filter((log) => log.status === "CRITICAL").length;
  const abnormalLogs = logs.filter(
    (log) => log.status === "HIGH" || log.status === "LOW"
  ).length;
  const stableLogs = logs.filter((log) => log.status === "STABLE").length;

  const handlePatientChange = (patientId) => {
    setForm((prev) => ({
      ...prev,
      patient: patientId,
    }));
  };

  const handleSubmit = async () => {
    if (!canManage) {
      toast.error("You are not allowed to submit vitals.");
      return;
    }

    if (!form.patient) {
      toast.error("Please select or enter patient record ID.");
      return;
    }

    if (!form.heartRate || !form.bp || !form.temp || !form.spo2) {
      toast.error("Heart rate, BP, temperature, and SpO2 are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${VITAL_API}/createvital`,
        {
          patient: form.patient.trim(),
          heartRate: Number(form.heartRate),
          bp: form.bp,
          temp: Number(form.temp),
          spo2: Number(form.spo2),
          notes: form.notes,
        },
        authConfig()
      );

      const newVital = mapVital(response.data.data);

      setLogs((prev) => [newVital, ...prev]);

      toast.success("Vitals log submitted.");

      setForm({
        patient: "",
        heartRate: "",
        bp: "120/80",
        temp: "36.5",
        spo2: "98",
        notes: "",
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to submit vitals.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVital = async (id) => {
    if (!canManage) {
      toast.error("You are not allowed to delete vitals.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this vital record?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${VITAL_API}/deletevital/${id}`, authConfig());

      setLogs((prev) => prev.filter((log) => log.id !== id));

      toast.success("Vital record deleted.");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete vital record.";
      toast.error(message);
    }
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>
              {isPatient ? "MY VITAL RECORDS" : "SMARTWARD VITAL MONITORING"}
            </div>

            <h1 style={heroTitle}>
              {isPatient ? "My Vitals" : "Vitals Monitoring"}
            </h1>

            <p style={heroSubtitle}>
              {isPatient
                ? "View your linked patient vitals, including heart rate, blood pressure, temperature, oxygen level, and clinical status."
                : "Monitor patient vitals, record new readings, detect abnormal values, and review clinical logs directly from SmartWard records."}
            </p>
          </div>

          <div style={heroActions}>
            <div style={roleBox}>
              <span style={roleLabel}>Access Role</span>
              <strong style={roleValue}>{role || "Loading..."}</strong>
            </div>

            <button onClick={fetchVitals} style={heroSecondaryBtn}>
              Refresh
            </button>
          </div>
        </section>

        <section style={container}>
          <div style={statsGrid}>
            <StatCard label="TOTAL LOGS" value={totalLogs} color="#064aa2" />
            <StatCard label="CRITICAL" value={criticalLogs} color="#cf171d" />
            <StatCard label="HIGH / LOW" value={abnormalLogs} color="#f59e0b" />
            <StatCard label="STABLE" value={stableLogs} color="#047857" />
          </div>

          {loading ? (
            <div style={loadingBox}>Loading vitals...</div>
          ) : (
            <div style={mainGrid}>
              <div>
                <div style={heartCard}>
                  <div style={cardHead}>
                    <div>
                      <p style={labelBlue}>HEART RATE</p>

                      <div style={bigValue}>
                        {form.heartRate || latestHeartRate} <span>BPM</span>
                      </div>
                    </div>

                    <span
                      style={{
                        ...stableBadge,
                        background:
                          liveStatus === "STABLE" ? "#dcfce7" : "#fee2e2",
                        color: statusColor,
                      }}
                    >
                      ● {liveStatus}
                    </span>
                  </div>

                  <div style={ecgBox}>
                    <svg
                      viewBox="0 0 700 210"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <polyline
                        points="0,110 35,110 45,60 60,155 75,110 120,110 135,30 150,180 165,110 220,110 235,75 250,145 265,110 315,110 330,65 345,150 360,110 405,110 420,90 435,130 450,110 505,110 520,35 535,185 550,110 600,110 615,80 630,140 645,110 700,110"
                        fill="none"
                        stroke="#003c8f"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div style={timeRow}>
                    <span>08:00 AM</span>
                    <span>12:00 PM</span>
                    <span>04:00 PM</span>
                    <span>08:00 PM</span>
                    <span>12:00 AM</span>
                    <span>04:00 AM</span>
                    <span>NOW</span>
                  </div>
                </div>

                <div style={smallGrid}>
                  <div style={miniCard}>
                    <div style={cardHead}>
                      <div>
                        <p style={labelRed}>
                          BLOOD
                          <br />
                          PRESSURE
                        </p>

                        <div style={{ ...bigValue, color: "#b91c1c" }}>
                          {form.bp || latestBP} <span>mmHg</span>
                        </div>
                      </div>

                      <span style={dangerBadge}>BP LOG</span>
                    </div>

                    <div style={barChart}>
                      {[45, 48, 56, 64, 72, 86].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            height: `${h}%`,
                            width: 34,
                            borderRadius: "10px 10px 0 0",
                            background:
                              i > 3 ? "#cf171d" : i > 2 ? "#fee2e2" : "#eef2f7",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={miniCard}>
                    <div style={cardHead}>
                      <div>
                        <p style={labelBlue}>TEMPERATURE</p>

                        <div style={bigValue}>
                          {form.temp || latestTemp} <span>°C</span>
                        </div>
                      </div>

                      <span style={stableBadge}>TEMP</span>
                    </div>

                    <div style={tempTrack}>
                      <div style={tempFill} />
                      <span style={tempPin}>▮</span>
                    </div>

                    <p style={smallText}>FEVER THRESHOLD: 38.0°C</p>
                  </div>
                </div>

                <div style={oxygenStrip}>
                  <div style={dropIcon}>💧</div>

                  <div>
                    <p style={stripLabel}>OXYGEN SATURATION (SPO2)</p>

                    <strong style={{ fontSize: 24 }}>
                      {form.spo2 || latestSpo2}%
                    </strong>

                    <span style={{ marginLeft: 10, color: "#94a3b8" }}>
                      Latest oxygen saturation record
                    </span>
                  </div>

                  <div style={signalBars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        style={{
                          height: 18 + n * 6,
                          background: n < 5 ? "#22c55e" : "#dcfce7",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <aside style={sidePanel}>
                {canManage ? (
                  <>
                    <div style={addHead}>
                      <div style={plusIcon}>＋</div>

                      <div>
                        <h2 style={{ margin: 0 }}>Add New Vitals</h2>

                        <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                          Submit new record to MongoDB
                        </p>
                      </div>
                    </div>

                    {canSelectPatients ? (
                      <label style={formLabel}>
                        SELECT PATIENT
                        <div style={inputWrap}>
                          <select
                            value={form.patient}
                            onChange={(e) => handlePatientChange(e.target.value)}
                            style={selectInput}
                          >
                            <option value="">Select patient</option>
                            {patients.map((patient) => (
                              <option key={patient.id} value={patient.id}>
                                {patient.name} — {patient.ward} / Bed{" "}
                                {patient.bed}
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                    ) : (
                      <Input
                        label="PATIENT RECORD ID"
                        placeholder="Paste patient record ID"
                        value={form.patient}
                        onChange={(v) => setForm({ ...form, patient: v })}
                      />
                    )}

                    <Input
                      label="HEART RATE (BPM)"
                      placeholder="e.g. 72"
                      value={form.heartRate}
                      onChange={(v) => setForm({ ...form, heartRate: v })}
                      suffix="BPM"
                    />

                    <div style={twoCols}>
                      <Input
                        label="BP (SYS/DIA)"
                        value={form.bp}
                        onChange={(v) => setForm({ ...form, bp: v })}
                      />

                      <Input
                        label="TEMP (°C)"
                        value={form.temp}
                        onChange={(v) => setForm({ ...form, temp: v })}
                      />
                    </div>

                    <Input
                      label="OXYGEN SPO2 (%)"
                      value={form.spo2}
                      onChange={(v) => setForm({ ...form, spo2: v })}
                      suffix="%"
                    />

                    <label style={formLabel}>
                      NOTES
                      <textarea
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        placeholder="Observe any symptoms..."
                        style={textarea}
                      />
                    </label>

                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{
                        ...submitBtn,
                        opacity: saving ? 0.7 : 1,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {saving ? "Submitting..." : "Submit Log Entry"}
                    </button>
                  </>
                ) : (
                  <div style={patientNotice}>
                    <div style={plusIcon}>👤</div>
                    <h2 style={{ marginBottom: 8 }}>Patient View Only</h2>
                    <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                      You can view your own vitals here. New vitals can only be
                      added by authorized clinical staff.
                    </p>
                  </div>
                )}

                <div style={divider} />

                <div style={logHead}>
                  <p style={sectionLabel}>RECENT LOGS</p>

                  <button onClick={() => setShowAllLogs(true)} style={linkBtn}>
                    View All
                  </button>
                </div>

                {logs.length === 0 && (
                  <div style={emptyBox}>No vitals record yet.</div>
                )}

                {logs.slice(0, 4).map((log) => (
                  <VitalLog
                    key={log.id}
                    log={log}
                    canManage={canManage}
                    onDelete={() => handleDeleteVital(log.id)}
                  />
                ))}
              </aside>
            </div>
          )}
        </section>

        {showAllLogs && (
          <div onClick={() => setShowAllLogs(false)} style={modalOverlay}>
            <div onClick={(e) => e.stopPropagation()} style={modalBox}>
              <h2 style={{ margin: "0 0 8px", fontSize: 28 }}>
                All Recent Logs
              </h2>

              <p style={{ margin: "0 0 22px", color: "#64748b" }}>
                Complete vitals history from backend database.
              </p>

              {logs.length === 0 && (
                <div style={emptyBox}>No vitals record found.</div>
              )}

              {logs.map((log) => (
                <VitalLog
                  key={log.id}
                  log={log}
                  modal
                  canManage={canManage}
                  onDelete={() => handleDeleteVital(log.id)}
                />
              ))}

              <button onClick={() => setShowAllLogs(false)} style={submitBtn}>
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...statCard, borderLeft: `5px solid ${color}` }}>
      <p style={statLabel}>{label}</p>
      <h2 style={{ ...statValue, color }}>{value}</h2>
    </div>
  );
}

function VitalLog({ log, onDelete, modal, canManage }) {
  const color = getStatusColor(log.status);

  return (
    <div style={modal ? modalLogRow : logRow}>
      <span style={{ ...dot, background: color }} />

      <div style={{ flex: 1 }}>
        <strong>
          HR: {log.heartRate} BPM • BP: {log.bp} • SpO2: {log.spo2}%
        </strong>

        <p style={{ margin: "4px 0 0", color: "#64748b" }}>
          Temp: {log.temp}°C • Status: {log.status}
        </p>

        <p style={{ margin: "4px 0 0", color: "#64748b" }}>
          Patient: {log.patientName}
          {log.patientWard || log.patientBed
            ? ` • ${log.patientWard || "Ward"} / Bed ${log.patientBed || "--"}`
            : ""}
        </p>

        <p style={{ margin: "4px 0 0", color: "#64748b" }}>
          {log.notes || "Vitals logged successfully."}
        </p>

        <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>
          Recorded by {log.recordedBy}
        </p>
      </div>

      <div style={{ textAlign: "right" }}>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>
          {formatTime(log.createdAt)}
        </span>

        {canManage && (
          <button onClick={onDelete} style={deleteBtn}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, suffix }) {
  return (
    <label style={formLabel}>
      {label}
      <div style={inputWrap}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={input}
        />

        {suffix && (
          <span style={{ color: "#94a3b8", fontWeight: 800 }}>{suffix}</span>
        )}
      </div>
    </label>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#111827",
  padding: "28px",
};

const hero = {
  background: "linear-gradient(135deg, #063b86 0%, #0b4aa2 45%, #0f766e 100%)",
  color: "#fff",
  borderRadius: "28px",
  padding: "28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  boxShadow: "0 24px 70px rgba(11,74,162,0.24)",
  marginBottom: "22px",
};

const eyebrow = {
  display: "inline-flex",
  padding: "7px 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "1.4px",
  marginBottom: "14px",
};

const heroTitle = {
  margin: 0,
  fontSize: "36px",
  fontWeight: "900",
};

const heroSubtitle = {
  margin: "10px 0 0",
  maxWidth: "720px",
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#dbeafe",
};

const heroActions = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const roleBox = {
  minWidth: "150px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "20px",
  padding: "14px 16px",
  textAlign: "right",
};

const roleLabel = {
  display: "block",
  fontSize: "11px",
  color: "#bfdbfe",
  fontWeight: "900",
  marginBottom: "5px",
};

const roleValue = {
  fontSize: "18px",
  textTransform: "capitalize",
};

const heroSecondaryBtn = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 20px",
  fontWeight: "900",
  cursor: "pointer",
};

const container = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 0 30px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 30,
};

const statCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
};

const statValue = {
  margin: "12px 0 0",
  fontSize: 34,
  fontWeight: 900,
};

const loadingBox = {
  background: "#fff",
  borderRadius: 18,
  padding: 30,
  color: "#64748b",
  fontWeight: 900,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.35fr .95fr",
  gap: 34,
};

const heartCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 28,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const labelBlue = {
  color: "#003c8f",
  fontWeight: 900,
  letterSpacing: 3,
  margin: 0,
};

const labelRed = {
  color: "#b91c1c",
  fontWeight: 900,
  letterSpacing: 3,
  margin: 0,
  lineHeight: 1.4,
};

const bigValue = {
  fontSize: 38,
  fontWeight: 900,
  marginTop: 8,
};

const ecgBox = {
  height: 260,
  background: "#f8fafc",
  borderRadius: 16,
  marginTop: 22,
  padding: 12,
};

const timeRow = {
  display: "flex",
  justifyContent: "space-between",
  color: "#8ca0ba",
  fontSize: 12,
  marginTop: 12,
};

const stableBadge = {
  padding: "8px 16px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
};

const dangerBadge = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
};

const smallGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
  marginTop: 26,
};

const miniCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 26,
  border: "1px solid #e9eef5",
  minHeight: 260,
};

const barChart = {
  height: 140,
  display: "flex",
  alignItems: "end",
  gap: 12,
  marginTop: 40,
};

const tempTrack = {
  width: 110,
  height: 14,
  background: "linear-gradient(90deg,#bae6fd,#bbf7d0,#fee2e2)",
  borderRadius: 999,
  position: "relative",
  marginTop: 42,
};

const tempFill = {
  width: "55%",
  height: "100%",
  background: "rgba(255,255,255,.5)",
};

const tempPin = {
  position: "absolute",
  left: "48%",
  top: -6,
};

const smallText = {
  color: "#8ca0ba",
  fontWeight: 800,
  fontSize: 12,
  marginTop: 16,
};

const oxygenStrip = {
  marginTop: 28,
  background: "#eef2f7",
  borderRadius: 18,
  padding: 24,
  display: "flex",
  alignItems: "center",
  gap: 18,
};

const dropIcon = {
  width: 50,
  height: 50,
  borderRadius: "50%",
  background: "#dbeafe",
  display: "grid",
  placeItems: "center",
};

const stripLabel = {
  color: "#64748b",
  letterSpacing: 2,
  fontWeight: 900,
  fontSize: 12,
  margin: "0 0 6px",
};

const signalBars = {
  marginLeft: "auto",
  display: "flex",
  gap: 8,
  alignItems: "end",
};

const sidePanel = {
  background: "#fff",
  borderRadius: 18,
  padding: 28,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const addHead = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  marginBottom: 30,
};

const plusIcon = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "#dbeafe",
  color: "#064aa2",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
  fontWeight: 900,
};

const patientNotice = {
  background: "#f8fafc",
  border: "1px solid #e9eef5",
  borderRadius: 18,
  padding: 20,
};

const formLabel = {
  display: "block",
  color: "#64748b",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 1,
  marginBottom: 18,
};

const inputWrap = {
  marginTop: 10,
  height: 52,
  background: "#f1f5f9",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  gap: 8,
};

const input = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  fontSize: 17,
  color: "#334155",
};

const selectInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  fontSize: 15,
  color: "#334155",
  fontWeight: 800,
};

const twoCols = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const textarea = {
  marginTop: 10,
  width: "100%",
  minHeight: 105,
  resize: "none",
  border: "none",
  outline: "none",
  background: "#f1f5f9",
  borderRadius: 12,
  padding: 16,
  fontSize: 17,
  boxSizing: "border-box",
};

const submitBtn = {
  width: "100%",
  height: 56,
  borderRadius: 999,
  border: "none",
  background: "#064aa2",
  color: "#fff",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 12px 22px rgba(6,74,162,.22)",
};

const divider = {
  height: 1,
  background: "#edf2f7",
  margin: "34px 0",
};

const logHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const sectionLabel = {
  color: "#94a3b8",
  letterSpacing: 2,
  fontWeight: 900,
};

const linkBtn = {
  border: "none",
  background: "transparent",
  color: "#003c8f",
  fontWeight: 900,
  cursor: "pointer",
};

const logRow = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 18,
};

const modalLogRow = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 18,
  background: "#f8fafc",
  padding: 14,
  borderRadius: 14,
};

const dot = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  marginTop: 7,
  flexShrink: 0,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 25px 60px rgba(15,23,42,.25)",
};

const emptyBox = {
  background: "#f8fafc",
  borderRadius: 14,
  padding: 16,
  color: "#64748b",
  fontWeight: 800,
};

const deleteBtn = {
  display: "block",
  marginTop: 8,
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 999,
  padding: "6px 12px",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 11,
}; 