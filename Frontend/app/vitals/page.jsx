"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const defaultLogs = [
  {
    id: 1,
    type: "BP",
    value: "142/95",
    note: "Elevated blood pressure observed.",
    time: "10:15 AM",
    color: "#cf171d",
  },
  {
    id: 2,
    type: "HR",
    value: "68 BPM",
    note: "Patient resting comfortably.",
    time: "08:00 AM",
    color: "#047857",
  },
];

export default function VitalsPage() {
  const [logs, setLogs] = useState(defaultLogs);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const [form, setForm] = useState({
    heartRate: "",
    bp: "120/80",
    temp: "36.5",
    spo2: "98",
    notes: "",
  });

  const latestHeartRate =
    logs.find((l) => l.type === "HR")?.value?.replace(" BPM", "") || 72;

  const latestBP = logs.find((l) => l.type === "BP")?.value || "142/95";

  const status = useMemo(() => {
    const hr = Number(form.heartRate || latestHeartRate);
    if (hr > 100) return "HIGH";
    if (hr < 60) return "LOW";
    return "STABLE";
  }, [form.heartRate, latestHeartRate]);

  const handleSubmit = () => {
    const newLogs = [];

    if (form.bp) {
      newLogs.push({
        id: Date.now() + 1,
        type: "BP",
        value: form.bp,
        note: form.notes || "Blood pressure logged successfully.",
        time: "Just now",
        color: "#cf171d",
      });
    }

    if (form.heartRate) {
      newLogs.push({
        id: Date.now() + 2,
        type: "HR",
        value: `${form.heartRate} BPM`,
        note: form.notes || "Heart rate logged successfully.",
        time: "Just now",
        color: "#047857",
      });
    }

    if (form.spo2) {
      newLogs.push({
        id: Date.now() + 3,
        type: "SpO2",
        value: `${form.spo2}%`,
        note: form.notes || "Oxygen saturation logged successfully.",
        time: "Just now",
        color: "#2563eb",
      });
    }

    setLogs((prev) => [...newLogs, ...prev]);
    toast.success("Vitals log submitted");

    setForm({
      heartRate: "",
      bp: "120/80",
      temp: "36.5",
      spo2: "98",
      notes: "",
    });
  };

  return (
    <AppShell>
      <main style={page}>
        <div style={topBar}>
          <div>
            <span style={{ color: "#64748b" }}>Patient:</span>{" "}
            <strong>Jonathan Harker (Bed 402)</strong>
          </div>

          <div style={topRight}>
            <button
              onClick={() => toast.success("Notifications opened")}
              style={iconBtn}
            >
              🔔
            </button>
            <div style={avatar}>👨‍⚕️</div>
            <strong>Dr. Sarah Miller</strong>
          </div>
        </div>

        <section style={container}>
          <div>
            <h1 style={title}>Vitals Monitoring</h1>
            <p style={subtitle}>
              Real-time data visualization over the last 24 hours.
            </p>
          </div>

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

                  <span style={stableBadge}>● {status}</span>
                </div>

                <div style={ecgBox}>
                  <svg viewBox="0 0 700 210" style={{ width: "100%", height: "100%" }}>
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
                        {latestBP} <span>mmHg</span>
                      </div>
                    </div>
                    <span style={dangerBadge}>HYPERTENSION</span>
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
                        {form.temp || "37.2"} <span>°C</span>
                      </div>
                    </div>
                    <span style={stableBadge}>NORMAL</span>
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
                  <strong style={{ fontSize: 24 }}>{form.spo2 || 98}%</strong>
                  <span style={{ marginLeft: 10, color: "#94a3b8" }}>
                    Stable at room air
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
              <div style={addHead}>
                <div style={plusIcon}>＋</div>
                <div>
                  <h2 style={{ margin: 0 }}>Add New Vitals</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                    Logged at 14:32 PM by Nurse J. Doe
                  </p>
                </div>
              </div>

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
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observe any symptoms..."
                  style={textarea}
                />
              </label>

              <button onClick={handleSubmit} style={submitBtn}>
                Submit Log Entry
              </button>

              <div style={divider} />

              <div style={logHead}>
                <p style={sectionLabel}>RECENT LOGS</p>

                <button onClick={() => setShowAllLogs(true)} style={linkBtn}>
                  View All
                </button>
              </div>

              {logs.slice(0, 4).map((log) => (
                <div key={log.id} style={logRow}>
                  <span style={{ ...dot, background: log.color }} />
                  <div style={{ flex: 1 }}>
                    <strong>
                      {log.type}: {log.value}
                    </strong>
                    <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                      {log.note}
                    </p>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {log.time}
                  </span>
                </div>
              ))}
            </aside>
          </div>
        </section>

        {showAllLogs && (
          <div onClick={() => setShowAllLogs(false)} style={modalOverlay}>
            <div onClick={(e) => e.stopPropagation()} style={modalBox}>
              <h2 style={{ margin: "0 0 8px", fontSize: 28 }}>
                All Recent Logs
              </h2>
              <p style={{ margin: "0 0 22px", color: "#64748b" }}>
                Complete vitals history for this patient.
              </p>

              {logs.map((log) => (
                <div key={log.id} style={modalLogRow}>
                  <span style={{ ...dot, background: log.color }} />
                  <div style={{ flex: 1 }}>
                    <strong>
                      {log.type}: {log.value}
                    </strong>
                    <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                      {log.note}
                    </p>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {log.time}
                  </span>
                </div>
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
};

const topBar = {
  height: 76,
  background: "#f8fbff",
  borderBottom: "1px solid #e6edf5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 34px",
};

const topRight = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const iconBtn = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
};

const avatar = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#dbeafe",
  display: "grid",
  placeItems: "center",
};

const container = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 34,
};

const title = {
  margin: 0,
  fontSize: 34,
  fontWeight: 900,
};

const subtitle = {
  margin: "4px 0 32px",
  color: "#475569",
  fontSize: 18,
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
  background: "#5ff0bd",
  color: "#047857",
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