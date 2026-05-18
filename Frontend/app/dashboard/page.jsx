"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

const defaultTasks = [
  {
    id: "9A",
    title: "Insulin Aspart (Novolog)",
    subtitle: "Patient: Robert Miller • Room 204-B",
    status: "Overdue 15m",
    statusColor: "#dc2626",
    done: false,
  },
  {
    id: "12B",
    title: "Warfarin (Coumadin) 5mg",
    subtitle: "Patient: Linda Thompson • Room 108",
    status: "Due in 45m",
    statusColor: "#047857",
    done: false,
  },
];

const defaultMessages = [
  {
    id: 1,
    type: "assistant",
    text: "Good morning, Dr. Chen. I've analyzed the overnight data. Ward B patient flow looks optimal, but I suggest reviewing Patient A102's recent potassium levels alongside their BP spike.",
  },
  {
    id: 2,
    type: "user",
    text: "Pull up lab results for A102 from the last 24 hours.",
  },
  {
    id: 3,
    type: "assistant",
    text: "Retrieving results... Potassium: 3.2 mEq/L (Low), Sodium: 138 mEq/L (Normal), BUN/Creatinine trending upward.",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState(defaultTasks);
  const [messages, setMessages] = useState(defaultMessages);
  const [prompt, setPrompt] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem("smartward_dashboard_tasks");
    const savedMessages = localStorage.getItem("smartward_dashboard_ai");

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    localStorage.setItem("smartward_dashboard_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("smartward_dashboard_ai", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setCurrentDateTime({
        date: now.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        time: now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
    };

    updateDateTime();

    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const pendingMedications = useMemo(
    () => tasks.filter((task) => !task.done).length + 10,
    [tasks]
  );

  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (task) => !task.done && task.status.toLowerCase().includes("overdue")
      ).length + 3,
    [tasks]
  );

  const markTaskDone = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, done: true, status: "Completed", statusColor: "#047857" }
          : task
      )
    );
  };

  const sendPrompt = () => {
    if (!prompt.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: prompt,
    };

    const assistantMessage = {
      id: Date.now() + 1,
      type: "assistant",
      text: `AI Assistant: I have logged your request — "${prompt}". This can be connected to backend later for live hospital insights.`,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setPrompt("");
  };

  const statCards = [
    {
      label: "Total Patients",
      value: "42",
      code: "PT",
      note: "+2% this week",
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Active Wards",
      value: "6",
      code: "WD",
      note: "Stable capacity",
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Critical Patients",
      value: "3",
      code: "CR",
      note: "Needs attention",
      color: "#dc2626",
      bg: "#fef2f2",
    },
    {
      label: "Pending Medications",
      value: `${pendingMedications}`,
      code: "RX",
      note: "Due soon",
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
  ];

  const cardStyle = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
  };

  return (
    <AppShell>
      <div
        style={{
          minHeight: "calc(100vh - 42px)",
          background:
            "radial-gradient(circle at top left, #dbeafe 0%, transparent 34%), radial-gradient(circle at top right, #ccfbf1 0%, transparent 30%), #f3f7fb",
          padding: "24px",
          boxSizing: "border-box",
          color: "#0f172a",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Hero Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #063b86 0%, #0b4aa2 45%, #0f766e 100%)",
              borderRadius: "30px",
              padding: "28px 30px",
              color: "#ffffff",
              boxShadow: "0 24px 70px rgba(11,74,162,0.24)",
              position: "relative",
              overflow: "hidden",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "260px",
                height: "260px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.13)",
                right: "-90px",
                top: "-110px",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "rgba(125,211,252,0.16)",
                left: "50%",
                bottom: "-120px",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "999px",
                    padding: "7px 13px",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "1.4px",
                    marginBottom: "16px",
                  }}
                >
                  SMARTWARD LIVE OVERVIEW
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "36px",
                    lineHeight: 1.1,
                    letterSpacing: "-1.2px",
                    fontWeight: "900",
                  }}
                >
                  Hospital Command Center
                </h1>

                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: "580px",
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "#dbeafe",
                  }}
                >
                  Monitor patients, wards, medication tasks, and urgent clinical
                  alerts from one clear workspace.
                </p>
              </div>

              <div
                style={{
                  minWidth: "190px",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "22px",
                  padding: "15px 17px",
                  textAlign: "right",
                }}
              >
                <p
                  style={{
                    margin: "0 0 5px",
                    fontSize: "11px",
                    color: "#bfdbfe",
                    fontWeight: "800",
                  }}
                >
                  LIVE TIME
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: "800",
                  }}
                >
                  {currentDateTime?.date || "Loading..."}
                </p>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#dbeafe",
                    fontWeight: "700",
                  }}
                >
                  {currentDateTime?.time || "--:--:--"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "22px",
            }}
          >
            {statCards.map((item) => (
              <div
                key={item.label}
                style={{
                  ...cardStyle,
                  padding: "18px",
                  minHeight: "132px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: "-30px",
                    top: "-30px",
                    width: "95px",
                    height: "95px",
                    borderRadius: "50%",
                    background: item.bg,
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "16px",
                        background: item.bg,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "900",
                        marginBottom: "14px",
                      }}
                    >
                      {item.code}
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "34px",
                        lineHeight: 1,
                        fontWeight: "900",
                        letterSpacing: "-0.8px",
                      }}
                    >
                      {item.value}
                    </h2>

                    <p
                      style={{
                        margin: "7px 0 0",
                        fontSize: "13px",
                        color: "#475569",
                        fontWeight: "800",
                      }}
                    >
                      {item.label}
                    </p>
                  </div>

                  <span
                    style={{
                      background: item.bg,
                      color: item.color,
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: "900",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.note}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.45fr 0.9fr",
              gap: "22px",
              alignItems: "start",
            }}
          >
            {/* Left Column */}
            <div style={{ display: "grid", gap: "18px" }}>
              {/* Critical Alert */}
              <div
                style={{
                  ...cardStyle,
                  padding: "20px",
                  border: "1px solid #fecaca",
                  background:
                    "linear-gradient(135deg, #fff7f7 0%, #ffffff 72%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "18px",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "15px", alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "18px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "900",
                        fontSize: "14px",
                      }}
                    >
                      A102
                    </div>

                    <div>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: "11px",
                          color: "#dc2626",
                          letterSpacing: "1.5px",
                          fontWeight: "900",
                        }}
                      >
                        CRITICAL CLINICAL ALERT
                      </p>

                      <h3
                        style={{
                          margin: "0 0 5px",
                          fontSize: "18px",
                          fontWeight: "900",
                          color: "#111827",
                        }}
                      >
                        Patient A102 BP Critical High
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#dc2626",
                          fontWeight: "800",
                        }}
                      >
                        185/110 mmHg • Detected 4m ago
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/patients/12345")}
                    style={{
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      borderRadius: "16px",
                      padding: "13px 20px",
                      fontSize: "12px",
                      fontWeight: "900",
                      cursor: "pointer",
                      boxShadow: "0 14px 28px rgba(220,38,38,0.22)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Attend Now
                  </button>
                </div>
              </div>

              {/* Ward Occupancy */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "19px",
                        fontWeight: "900",
                      }}
                    >
                      Ward Occupancy
                    </h2>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      Current capacity and bed availability
                    </p>
                  </div>

                  <button
                    onClick={() => router.push("/wards")}
                    style={{
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      color: "#0b4aa2",
                      borderRadius: "999px",
                      padding: "9px 14px",
                      fontSize: "12px",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    Manage Wards →
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      name: "Ward A: ICU",
                      beds: "7 of 8 beds occupied",
                      percent: "88%",
                      color: "#2563eb",
                      badgeBg: "#dcfce7",
                      badgeColor: "#047857",
                    },
                    {
                      name: "Ward B: Cardiology",
                      beds: "12 of 20 beds occupied",
                      percent: "60%",
                      color: "#0ea5e9",
                      badgeBg: "#dbeafe",
                      badgeColor: "#2563eb",
                    },
                  ].map((ward) => (
                    <div
                      key={ward.name}
                      style={{
                        ...cardStyle,
                        padding: "18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "900",
                            }}
                          >
                            {ward.name}
                          </h3>

                          <p
                            style={{
                              margin: "5px 0 0",
                              color: "#64748b",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {ward.beds}
                          </p>
                        </div>

                        <span
                          style={{
                            background: ward.badgeBg,
                            color: ward.badgeColor,
                            borderRadius: "999px",
                            padding: "7px 11px",
                            fontSize: "11px",
                            fontWeight: "900",
                          }}
                        >
                          {ward.percent} Full
                        </span>
                      </div>

                      <div
                        style={{
                          height: "10px",
                          background: "#e2e8f0",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: ward.percent,
                            height: "100%",
                            background: ward.color,
                            borderRadius: "999px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication Tasks */}
              <div style={{ ...cardStyle, padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "19px",
                        fontWeight: "900",
                      }}
                    >
                      Medication Tasks
                    </h2>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      Track scheduled and overdue medication rounds
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <span
                      style={{
                        background: "#eef2ff",
                        color: "#475569",
                        padding: "7px 11px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "900",
                      }}
                    >
                      Upcoming {pendingMedications}
                    </span>

                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "7px 11px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "900",
                      }}
                    >
                      Overdue {overdueCount}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "11px" }}>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr 120px 42px",
                        gap: "14px",
                        alignItems: "center",
                        background: task.done ? "#f8fafc" : "#ffffff",
                        border: "1px solid #edf2f7",
                        borderRadius: "18px",
                        padding: "13px 14px",
                        opacity: task.done ? 0.65 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "14px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "900",
                        }}
                      >
                        {task.id}
                      </div>

                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: "14px",
                            fontWeight: "900",
                          }}
                        >
                          {task.title}
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {task.subtitle}
                        </p>
                      </div>

                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            color: "#94a3b8",
                            fontSize: "10px",
                            fontWeight: "900",
                            letterSpacing: "0.9px",
                          }}
                        >
                          STATUS
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color: task.statusColor,
                            fontSize: "12px",
                            fontWeight: "900",
                          }}
                        >
                          {task.status}
                        </p>
                      </div>

                      <button
                        onClick={() => markTaskDone(task.id)}
                        disabled={task.done}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "13px",
                          border: "1px solid #cbd5e1",
                          background: task.done ? "#dcfce7" : "#ffffff",
                          color: task.done ? "#047857" : "#94a3b8",
                          fontSize: "16px",
                          fontWeight: "900",
                          cursor: task.done ? "default" : "pointer",
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: "grid", gap: "18px" }}>
              {/* AI Assistant */}
              <div
                style={{
                  background:
                    "linear-gradient(180deg, #0b4aa2 0%, #063a86 100%)",
                  borderRadius: "26px",
                  padding: "20px",
                  color: "#ffffff",
                  boxShadow: "0 24px 60px rgba(11,74,162,0.22)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "13px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    AI
                  </div>

                  <div>
                    <p
                      style={{
                        margin: "0 0 3px",
                        fontSize: "11px",
                        letterSpacing: "1.5px",
                        color: "#bfdbfe",
                        fontWeight: "900",
                      }}
                    >
                      CLINICAL ASSISTANT
                    </p>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "900",
                      }}
                    >
                      Ward Assistant
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    maxHeight: "310px",
                    overflowY: "auto",
                    paddingRight: "4px",
                    marginBottom: "14px",
                  }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        background:
                          message.type === "assistant"
                            ? "rgba(255,255,255,0.12)"
                            : "#ffffff",
                        color:
                          message.type === "assistant" ? "#ffffff" : "#0b4aa2",
                        border:
                          message.type === "assistant"
                            ? "1px solid rgba(255,255,255,0.14)"
                            : "1px solid transparent",
                        borderRadius: "16px",
                        padding: "12px",
                        fontSize: "12px",
                        lineHeight: 1.55,
                        fontWeight: "650",
                      }}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
                    placeholder="Ask about patients or tasks..."
                    style={{
                      flex: 1,
                      height: "44px",
                      borderRadius: "15px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#ffffff",
                      outline: "none",
                      padding: "0 14px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />

                  <button
                    onClick={sendPrompt}
                    style={{
                      width: "44px",
                      height: "44px",
                      border: "none",
                      borderRadius: "15px",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: "16px",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ ...cardStyle, padding: "20px" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "11px",
                    letterSpacing: "1.8px",
                    fontWeight: "900",
                    color: "#0b4aa2",
                  }}
                >
                  QUICK ACTIONS
                </p>

                <h2
                  style={{
                    margin: "0 0 15px",
                    fontSize: "18px",
                    fontWeight: "900",
                  }}
                >
                  Navigate Faster
                </h2>

                <div style={{ display: "grid", gap: "10px" }}>
                  {[
                    ["View Patients", "/patients"],
                    ["Manage Wards", "/wards"],
                    ["Medication Schedule", "/medications"],
                  ].map(([label, path]) => (
                    <button
                      key={label}
                      onClick={() => router.push(path)}
                      style={{
                        height: "42px",
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        color: "#0b4aa2",
                        borderRadius: "14px",
                        fontSize: "12px",
                        fontWeight: "900",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "0 14px",
                      }}
                    >
                      {label} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}