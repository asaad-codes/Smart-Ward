"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const AI_API = `${API_BASE_URL}/ai`; 

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

export default function AIAssistantPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "Hi, I am SmartWard AI. I can answer only from your SmartWard app data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const role = user?.role || "";

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      toast.error("Please login first.");
      router.push("/login");
      return;
    }

    setUser(storedUser);
  }, [router]);

  const suggestions = useMemo(() => {
    if (role === "patient") {
      return [
        "Show my patient details",
        "Show my medications",
        "Show my latest vitals",
        "What is my current status?",
        "How can I download my report?",
      ];
    }

    if (role === "nurse") {
      return [
        "Show medication summary",
        "Show missed medications",
        "Show latest vitals",
        "Show critical vitals",
      ];
    }

    return [
      "Show dashboard summary",
      "Show critical patients",
      "Show medication summary",
      "Show latest vitals",
      "Show ward records",
    ];
  }, [role]);

  const askAI = async (customMessage) => {
    const finalMessage = String(customMessage || input).trim();

    if (!finalMessage) {
      toast.error("Please enter a question.");
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: finalMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);

      const response = await axios.post(
        `${AI_API}/ask`,
        {
          message: finalMessage,
        },
        authConfig()
      );

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        text:
          response.data?.reply ||
          "I can only answer using SmartWard app data.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        text:
          error.response?.data?.message ||
          "AI assistant failed to answer from SmartWard data.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>SMARTWARD DATA AI</div>

            <h1 style={title}>AI Assistant</h1>

            <p style={subtitle}>
              This assistant only answers from SmartWard records available to
              your role. It will not answer outside app data.
            </p>
          </div>

          <div style={roleBox}>
            <span style={roleLabel}>Access Role</span>
            <strong style={roleValue}>{role || "Loading..."}</strong>
          </div>
        </section>

        <section style={layout}>
          <div style={chatCard}>
            <div style={chatHeader}>
              <div>
                <h2 style={chatTitle}>Clinical Data Chat</h2>
                <p style={chatSubtitle}>
                  Ask about patients, medications, vitals, wards, or reports.
                </p>
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 1,
                      type: "assistant",
                      text: "Chat cleared. Ask me anything from SmartWard app data.",
                    },
                  ])
                }
                style={clearBtn}
              >
                Clear
              </button>
            </div>

            <div style={messagesBox}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    ...messageBubble,
                    alignSelf:
                      message.type === "user" ? "flex-end" : "flex-start",
                    background:
                      message.type === "user" ? "#0b4aa2" : "#ffffff",
                    color: message.type === "user" ? "#ffffff" : "#0f172a",
                    border:
                      message.type === "user"
                        ? "1px solid #0b4aa2"
                        : "1px solid #e5e7eb",
                  }}
                >
                  <pre style={messageText}>{message.text}</pre>
                </div>
              ))}

              {loading && (
                <div
                  style={{
                    ...messageBubble,
                    alignSelf: "flex-start",
                    background: "#ffffff",
                    color: "#64748b",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  SmartWard AI is checking app data...
                </div>
              )}
            </div>

            <div style={inputRow}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") askAI();
                }}
                placeholder="Ask from SmartWard data..."
                style={inputStyle}
              />

              <button onClick={() => askAI()} disabled={loading} style={sendBtn}>
                {loading ? "..." : "Ask"}
              </button>
            </div>
          </div>

          <aside style={sideCard}>
            <h3 style={sideTitle}>Suggested Questions</h3>

            <div style={suggestionList}>
              {suggestions.map((question) => (
                <button
                  key={question}
                  onClick={() => askAI(question)}
                  style={suggestionBtn}
                >
                  {question}
                </button>
              ))}
            </div>

            <div style={noticeBox}>
              <strong>Data-only rule:</strong>
              <p>
                If the question is outside SmartWard records, the assistant will
                refuse and say it can only answer using app data.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "28px",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
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

const title = {
  margin: 0,
  fontSize: "34px",
  fontWeight: "900",
};

const subtitle = {
  margin: "10px 0 0",
  maxWidth: "680px",
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#dbeafe",
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

const layout = {
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: "22px",
  alignItems: "start",
};

const chatCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  overflow: "hidden",
};

const chatHeader = {
  padding: "20px",
  borderBottom: "1px solid #edf2f7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
};

const chatTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "900",
  color: "#0b4aa2",
};

const chatSubtitle = {
  margin: "5px 0 0",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "600",
};

const clearBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  height: "38px",
  padding: "0 16px",
  fontWeight: "900",
  cursor: "pointer",
};

const messagesBox = {
  minHeight: "440px",
  maxHeight: "540px",
  overflowY: "auto",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "#f8fafc",
};

const messageBubble = {
  maxWidth: "78%",
  borderRadius: "18px",
  padding: "13px 15px",
  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
};

const messageText = {
  margin: 0,
  whiteSpace: "pre-wrap",
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: "13px",
  lineHeight: 1.65,
};

const inputRow = {
  padding: "16px",
  borderTop: "1px solid #edf2f7",
  display: "flex",
  gap: "10px",
};

const inputStyle = {
  flex: 1,
  height: "46px",
  borderRadius: "999px",
  border: "1px solid #dbe3ed",
  background: "#ffffff",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
};

const sendBtn = {
  border: "none",
  background: "#0b4aa2",
  color: "#fff",
  borderRadius: "999px",
  height: "46px",
  padding: "0 24px",
  fontWeight: "900",
  cursor: "pointer",
};

const sideCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const sideTitle = {
  margin: "0 0 14px",
  fontSize: "18px",
  fontWeight: "900",
  color: "#0f172a",
};

const suggestionList = {
  display: "grid",
  gap: "10px",
};

const suggestionBtn = {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#0b4aa2",
  borderRadius: "14px",
  minHeight: "42px",
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: "900",
  cursor: "pointer",
};

const noticeBox = {
  marginTop: "18px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.6,
};