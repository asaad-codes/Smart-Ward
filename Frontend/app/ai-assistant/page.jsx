"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const defaultMessages = [
  {
    role: "assistant",
    text: "Good morning, Dr. Chen. I analyzed overnight patient data. Ward B is stable, but Patient A102 needs review due to BP elevation.",
    time: "08:42 AM",
  },
];

const insights = [
  {
    title: "Critical BP Pattern",
    patient: "Patient A102",
    detail: "185/110 mmHg detected 4 minutes ago. Immediate clinical review recommended.",
    level: "urgent",
  },
  {
    title: "Medication Risk",
    patient: "Sarah Lopez",
    detail: "Insulin Aspart is due. Blood glucose check should be verified before administration.",
    level: "warning",
  },
  {
    title: "Ward Status",
    patient: "North Wing • B2",
    detail: "Overall ward occupancy is stable with 4 clean beds available.",
    level: "stable",
  },
];

export default function AIAssistantPage() {
  const router = useRouter();

  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(insights[0]);

  const riskScore = useMemo(() => {
    const urgent = insights.filter((i) => i.level === "urgent").length;
    return urgent ? "High" : "Normal";
  }, []);

  const sendMessage = () => {
    if (!input.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const userMessage = {
      role: "user",
      text: input.trim(),
      time: "Just now",
    };

    const aiReply = {
      role: "assistant",
      text: `I reviewed your request: "${input.trim()}". Recommended action: check latest vitals, confirm medication status, and notify the responsible clinician if risk remains elevated.`,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMessage, aiReply]);
    setInput("");
    toast.success("AI response generated");
  };

  const generateReport = () => {
    const report = `SmartWard AI Clinical Summary

Risk Score: ${riskScore}

Selected Insight: ${selectedInsight.title}
Patient/Ward: ${selectedInsight.patient}
Detail: ${selectedInsight.detail}

Recommended Action:
Review vitals, confirm medication status, and document clinical response.`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "smartward-ai-summary.txt";
    a.click();

    URL.revokeObjectURL(url);
    toast.success("AI report downloaded");
  };

  const clearChat = () => {
    setMessages(defaultMessages);
    toast.success("Chat reset");
  };

  return (
    <AppShell>
      <main style={page}>
        <header style={topBar}>
          <div>
            <h1 style={title}>Ward Assistant</h1>
            <p style={subtitle}>Clinical AI analysis active for SmartWard operations.</p>
          </div>

          <div style={topActions}>
            <button onClick={() => toast.success("Notifications opened")} style={iconBtn}>
              🔔
            </button>

            <button onClick={generateReport} style={secondaryBtn}>
              ⇩ Generate Report
            </button>

            <button onClick={clearChat} style={primaryBtn}>
              Clear Chat
            </button>
          </div>
        </header>

        <section style={container}>
          <div style={heroGrid}>
            <div style={heroCard}>
              <div style={botIcon}>🤖</div>

              <p style={eyebrow}>CLINICAL AI ANALYSIS ACTIVE</p>

              <h2 style={heroTitle}>SmartWard AI Assistant</h2>

              <p style={heroText}>
                Review patient risks, medication alerts, ward capacity, and clinical
                recommendations in one intelligent workspace.
              </p>

              <div style={heroStats}>
                <Metric label="Risk Level" value={riskScore} danger />
                <Metric label="Open Alerts" value="03" />
                <Metric label="Response Time" value="2s" />
              </div>
            </div>

            <div style={riskCard}>
              <p style={cardLabel}>CURRENT PRIORITY</p>

              <h3 style={{ margin: "8px 0", fontSize: 28 }}>
                {selectedInsight.title}
              </h3>

              <p style={{ color: "#475569", lineHeight: 1.6 }}>
                {selectedInsight.detail}
              </p>

              <button
                onClick={() => router.push("/patients")}
                style={primaryBtnWide}
              >
                Open Clinical Review
              </button>
            </div>
          </div>

          <div style={mainGrid}>
            <aside style={insightPanel}>
              <div style={panelHead}>
                <h2 style={panelTitle}>AI Insights</h2>
                <span style={liveBadge}>LIVE</span>
              </div>

              {insights.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    setSelectedInsight(item);
                    toast.success(`${item.title} selected`);
                  }}
                  style={{
                    ...insightCard,
                    borderColor:
                      selectedInsight.title === item.title ? "#064aa2" : "#e9eef5",
                    background:
                      selectedInsight.title === item.title ? "#eef6ff" : "#f8fafc",
                  }}
                >
                  <span style={levelDot(item.level)} />
                  <div>
                    <strong>{item.title}</strong>
                    <p style={insightMeta}>{item.patient}</p>
                    <p style={insightText}>{item.detail}</p>
                  </div>
                </button>
              ))}

              <div style={quickBox}>
                <h3 style={{ marginTop: 0 }}>Quick Actions</h3>

                <button onClick={() => router.push("/vitals")} style={quickBtn}>
                  Scan Vitals
                </button>

                <button onClick={() => router.push("/medications")} style={quickBtn}>
                  Check Medications
                </button>

                <button onClick={() => router.push("/wards")} style={quickBtn}>
                  Review Capacity
                </button>
              </div>
            </aside>

            <section style={chatPanel}>
              <div style={chatHeader}>
                <div>
                  <h2 style={panelTitle}>Clinical Chat</h2>
                  <p style={{ margin: "5px 0 0", color: "#64748b" }}>
                    Ask about patients, tasks, vitals, or ward alerts.
                  </p>
                </div>

                <span style={secureBadge}>SECURE</span>
              </div>

              <div style={chatBody}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...messageRow,
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...messageBubble,
                        background: msg.role === "user" ? "#dbeafe" : "#064aa2",
                        color: msg.role === "user" ? "#0f172a" : "#fff",
                      }}
                    >
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
                      <span
                        style={{
                          display: "block",
                          marginTop: 8,
                          fontSize: 11,
                          opacity: 0.75,
                        }}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={composer}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Ask about patients or tasks..."
                  style={chatInput}
                />

                <button onClick={sendMessage} style={sendBtn}>
                  ➤
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Metric({ label, value, danger }) {
  return (
    <div style={metricBox}>
      <p style={metricLabel}>{label}</p>
      <h3 style={{ ...metricValue, color: danger ? "#fecaca" : "#fff" }}>
        {value}
      </h3>
    </div>
  );
}

function levelDot(level) {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background:
      level === "urgent" ? "#cf171d" : level === "warning" ? "#f59e0b" : "#047857",
    marginTop: 6,
    flexShrink: 0,
  };
}

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  color: "#111827",
  fontFamily: "Inter, Arial, sans-serif",
};

const topBar = {
  height: 86,
  background: "#f8fbff",
  borderBottom: "1px solid #e6edf5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 34px",
};

const title = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
  color: "#003c8f",
};

const subtitle = {
  margin: "6px 0 0",
  color: "#64748b",
};

const topActions = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const iconBtn = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
};

const primaryBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: "999px",
  minHeight: 46,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  minHeight: 46,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const container = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 30,
};

const heroGrid = {
  display: "grid",
  gridTemplateColumns: "1.5fr .85fr",
  gap: 24,
  marginBottom: 24,
};

const heroCard = {
  background: "linear-gradient(135deg,#064aa2,#075ec9)",
  color: "#fff",
  borderRadius: 26,
  padding: 34,
  boxShadow: "0 18px 34px rgba(6,74,162,.24)",
};

const botIcon = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: "rgba(255,255,255,.16)",
  display: "grid",
  placeItems: "center",
  fontSize: 28,
};

const eyebrow = {
  letterSpacing: 3,
  fontSize: 12,
  fontWeight: 900,
  marginTop: 24,
};

const heroTitle = {
  fontSize: 44,
  margin: "10px 0",
  fontWeight: 900,
};

const heroText = {
  color: "#dbeafe",
  fontSize: 17,
  lineHeight: 1.6,
  maxWidth: 680,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 16,
  marginTop: 28,
};

const metricBox = {
  background: "rgba(255,255,255,.14)",
  borderRadius: 16,
  padding: 18,
};

const metricLabel = {
  margin: 0,
  letterSpacing: 2,
  fontSize: 11,
  fontWeight: 900,
  color: "#bfdbfe",
};

const metricValue = {
  margin: "8px 0 0",
  fontSize: 28,
};

const riskCard = {
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const cardLabel = {
  margin: 0,
  color: "#94a3b8",
  letterSpacing: 2,
  fontWeight: 900,
};

const primaryBtnWide = {
  ...primaryBtn,
  width: "100%",
  marginTop: 18,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: ".85fr 1.4fr",
  gap: 24,
};

const insightPanel = {
  background: "#fff",
  borderRadius: 22,
  padding: 24,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const panelHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const panelTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
};

const liveBadge = {
  background: "#dcfce7",
  color: "#047857",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: 11,
  fontWeight: 900,
};

const insightCard = {
  width: "100%",
  textAlign: "left",
  border: "2px solid #e9eef5",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  display: "flex",
  gap: 12,
  cursor: "pointer",
};

const insightMeta = {
  margin: "5px 0",
  color: "#003c8f",
  fontWeight: 800,
};

const insightText = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.5,
  fontSize: 14,
};

const quickBox = {
  marginTop: 20,
  background: "#eef2f7",
  borderRadius: 16,
  padding: 18,
};

const quickBtn = {
  width: "100%",
  height: 42,
  border: "none",
  borderRadius: 12,
  background: "#fff",
  color: "#003c8f",
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: 10,
};

const chatPanel = {
  background: "#fff",
  borderRadius: 22,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
  overflow: "hidden",
};

const chatHeader = {
  padding: 24,
  borderBottom: "1px solid #edf2f7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const secureBadge = {
  background: "#dbeafe",
  color: "#003c8f",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 900,
};

const chatBody = {
  height: 410,
  overflowY: "auto",
  padding: 24,
  background: "#f8fafc",
};

const messageRow = {
  display: "flex",
  marginBottom: 16,
};

const messageBubble = {
  maxWidth: "76%",
  borderRadius: 18,
  padding: "15px 18px",
  boxShadow: "0 8px 18px rgba(15,23,42,.05)",
};

const composer = {
  padding: 18,
  display: "flex",
  gap: 12,
  borderTop: "1px solid #edf2f7",
};

const chatInput = {
  flex: 1,
  height: 52,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: "999px",
  padding: "0 18px",
  outline: "none",
  fontSize: 15,
};

const sendBtn = {
  width: 54,
  height: 54,
  borderRadius: "50%",
  border: "none",
  background: "#047857",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
};