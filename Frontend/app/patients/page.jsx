"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";
import { useAppContext } from "../context/AppContext";
import { getItem, setItem } from "../../lib/storage";

const defaultPatients = [
  {
    id: "12345",
    initials: "JD",
    name: "Jonathan Davies",
    pid: "SW-882190",
    age: 62,
    sex: "Male",
    ward: "ICU North",
    bed: "#04",
    status: "CRITICAL",
    updatedAt: "2 mins ago",
    subStatus: "Vitals fluctuating",
  },
  {
    id: "102933",
    initials: "EM",
    name: "Elena Martinez",
    pid: "SW-102933",
    age: 29,
    sex: "Female",
    ward: "Maternity B",
    bed: "#12",
    status: "OBSERVATION",
    updatedAt: "18 mins ago",
    subStatus: "Post-op monitoring",
  },
  {
    id: "449102",
    initials: "RK",
    name: "Robert Kagawa",
    pid: "SW-449102",
    age: 45,
    sex: "Male",
    ward: "General Ward",
    bed: "#40",
    status: "STABLE",
    updatedAt: "42 mins ago",
    subStatus: "Stable vitals",
  },
  {
    id: "990231",
    initials: "SW",
    name: "Sarah Williams",
    pid: "SW-990231",
    age: 74,
    sex: "Female",
    ward: "Cardiology",
    bed: "#02",
    status: "CRITICAL",
    updatedAt: "Just now",
    subStatus: "High arrhythmia alert",
  },
  {
    id: "223401",
    initials: "MT",
    name: "Marcus Thompson",
    pid: "SW-223401",
    age: 38,
    sex: "Male",
    ward: "Recovery A",
    bed: "#19",
    status: "STABLE",
    updatedAt: "1h 12m ago",
    subStatus: "Awaiting discharge",
  },
];

function getStatusStyles(status) {
  const s = String(status || "").toUpperCase();

  if (s === "CRITICAL") {
    return { bg: "#ffd9d9", color: "#b91c1c" };
  }

  if (s === "OBSERVATION") {
    return { bg: "#dbe7ff", color: "#334155" };
  }

  return { bg: "#5ff0bd", color: "#027a48" };
}

export default function PatientsPage() {
  const router = useRouter();
  const appContext = useAppContext?.() || {};

  const contextPatients =
    appContext.patients ||
    appContext.appPatients ||
    appContext.patientList ||
    [];

  const setContextPatients =
    appContext.setPatients ||
    appContext.setAppPatients ||
    appContext.setPatientList;

  const [patients, setPatients] = useState(defaultPatients);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search, setSearch] = useState("");
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    sex: "Male",
    ward: "",
    bed: "",
    status: "STABLE",
  });

  useEffect(() => {
    const saved = getItem("smartward_patients", defaultPatients);
    const initialPatients =
      Array.isArray(saved) && saved.length ? saved : defaultPatients;

    setPatients(initialPatients);

    if (typeof setContextPatients === "function") {
      setContextPatients(initialPatients);
    }
  }, [setContextPatients]);

  useEffect(() => {
    if (Array.isArray(contextPatients) && contextPatients.length) {
      setPatients(contextPatients);
    }
  }, [contextPatients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const q = search.trim().toLowerCase();

      const matchesTab =
        activeTab === "all"
          ? true
          : String(patient.status || "").toUpperCase() !== "STABLE";

      const matchesStatus =
        statusFilter === "All Statuses"
          ? true
          : String(patient.status || "").toUpperCase() ===
            statusFilter.toUpperCase();

      const matchesSearch =
        !q ||
        patient.name.toLowerCase().includes(q) ||
        patient.id.toLowerCase().includes(q) ||
        patient.pid.toLowerCase().includes(q) ||
        patient.ward.toLowerCase().includes(q) ||
        patient.bed.toLowerCase().includes(q);

      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [patients, activeTab, statusFilter, search]);

  const criticalCount = patients.filter(
    (p) => String(p.status).toUpperCase() === "CRITICAL"
  ).length;

  const stableCount = patients.filter(
    (p) => String(p.status).toUpperCase() === "STABLE"
  ).length;

  const handleAdmitPatient = () => {
    if (!newPatient.name || !newPatient.age || !newPatient.ward || !newPatient.bed) {
      toast.error("Please fill all required fields");
      return;
    }

    const words = newPatient.name.trim().split(" ");
    const initials =
      ((words[0]?.[0] || "") + (words[1]?.[0] || words[0]?.[1] || "")).toUpperCase();

    const patient = {
      id: String(Date.now()),
      initials,
      name: newPatient.name.trim(),
      pid: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
      age: Number(newPatient.age),
      sex: newPatient.sex,
      ward: newPatient.ward.trim(),
      bed: newPatient.bed.trim(),
      status: newPatient.status,
      updatedAt: "Just now",
      subStatus:
        newPatient.status === "CRITICAL"
          ? "Priority observation"
          : "New admission",
    };

    const updated = [patient, ...patients];

    setPatients(updated);
    setItem("smartward_patients", updated);

    if (typeof setContextPatients === "function") {
      setContextPatients(updated);
    }

    toast.success(`${patient.name} admitted successfully`);
    setShowAdmitModal(false);
    setNewPatient({
      name: "",
      age: "",
      sex: "Male",
      ward: "",
      bed: "",
      status: "STABLE",
    });
  };

  return (
    <AppShell>
      <main
        style={{
          minHeight: "100vh",
          background: "#f4f7fb",
          color: "#111827",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <section style={{ padding: "24px 36px 36px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "24px",
              marginBottom: "34px",
            }}
          >
            <div
              style={{
                width: "460px",
                height: "46px",
                borderRadius: "999px",
                background: "#eef2f7",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                gap: "10px",
              }}
            >
              <span style={{ color: "#64748b" }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, ID, or ward..."
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "15px",
                  color: "#334155",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <span style={{ fontSize: "20px" }}>🔔</span>
              <div style={{ width: "1px", height: "38px", background: "#d8dee8" }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "14px" }}>Dr. Sarah Chen</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Chief Medical Officer
                </div>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#dbeafe",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "22px",
                }}
              >
                👩‍⚕️
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  letterSpacing: "2px",
                  color: "#64748b",
                  fontWeight: 800,
                  marginBottom: "10px",
                }}
              >
                DIRECTORY <span style={{ margin: "0 12px" }}>›</span>
                <span style={{ color: "#003c8f" }}>PATIENT LIST</span>
              </div>
              <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 900 }}>
                Active Patients
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <StatCard icon="⚠️" label="CRITICAL" value={String(criticalCount).padStart(2, "0")} red />
              <StatCard icon="✅" label="STABLE" value={stableCount} />
              <button
                onClick={() => setShowAdmitModal(true)}
                style={{
                  height: "68px",
                  padding: "0 34px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#064aa2",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "17px",
                  cursor: "pointer",
                  boxShadow: "0 14px 24px rgba(6,74,162,0.24)",
                }}
              >
                👥 Admit Patient
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              border: "1px solid #e9eef5",
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              overflow: "hidden",
              marginBottom: "34px",
            }}
          >
            <div
              style={{
                padding: "22px 26px",
                borderBottom: "1px solid #edf2f7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    background: "#f1f5f9",
                    borderRadius: "10px",
                    padding: "5px",
                    gap: "6px",
                  }}
                >
                  <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
                    All Patients
                  </TabButton>
                  <TabButton active={activeTab === "assigned"} onClick={() => setActiveTab("assigned")}>
                    My Assigned
                  </TabButton>
                </div>

                <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />

                <label style={{ color: "#64748b", fontSize: "14px" }}>
                  Filter by Status:
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  <option>All Statuses</option>
                  <option>CRITICAL</option>
                  <option>OBSERVATION</option>
                  <option>STABLE</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "24px", color: "#64748b", fontSize: "14px" }}>
                <button onClick={() => toast.success("Export started")} style={linkBtn}>
                  ⇩ Export
                </button>
                <button onClick={() => window.print()} style={linkBtn}>
                  🖨 Print
                </button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["PATIENT NAME", "AGE / SEX", "WARD / BED", "STATUS", "LAST UPDATED"].map(
                    (head) => (
                      <th
                        key={head}
                        style={{
                          textAlign: "left",
                          padding: "18px 26px",
                          fontSize: "11px",
                          letterSpacing: "1.7px",
                          color: "#6b7280",
                          fontWeight: 900,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {head}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => {
                  const badge = getStatusStyles(patient.status);

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid #edf2f7",
                      }}
                    >
                      <td style={{ padding: "22px 26px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "50%",
                              background: "#eef6ff",
                              border: "1px solid #cbdbea",
                              color: "#07459b",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              fontSize: "18px",
                            }}
                          >
                            {patient.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "16px" }}>
                              {patient.name}
                            </div>
                            <div style={{ fontSize: "13px", color: "#64748b" }}>
                              PID: {patient.pid}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={td}>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>{patient.age} yrs</div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>{patient.sex}</div>
                      </td>

                      <td style={td}>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>{patient.ward}</div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>Bed {patient.bed}</div>
                      </td>

                      <td style={td}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            borderRadius: "999px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            fontWeight: 900,
                          }}
                        >
                          {patient.status}
                        </span>
                      </td>

                      <td style={td}>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>
                          {patient.updatedAt}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color:
                              patient.status === "CRITICAL"
                                ? "#dc2626"
                                : "#64748b",
                            fontStyle:
                              patient.status === "CRITICAL" ? "italic" : "normal",
                          }}
                        >
                          {patient.subStatus}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div
              style={{
                padding: "22px 26px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                Showing <b>1 - {filteredPatients.length}</b> of 146 active patients
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <button style={pageBtn(false)}>‹</button>
                <button style={pageBtn(true)}>1</button>
                <button style={pageBtn(false)}>2</button>
                <button style={pageBtn(false)}>3</button>
                <span>…</span>
                <button style={pageBtn(false)}>24</button>
                <button style={pageBtn(false)}>›</button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 0.85fr",
              gap: "28px",
            }}
          >
            <div
              style={{
                background: "#064aa2",
                borderRadius: "20px",
                padding: "28px",
                color: "#fff",
                boxShadow: "0 18px 30px rgba(6,74,162,0.22)",
                minHeight: "190px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "22px" }}>Ward Occupancy Overview</h2>
                <span
                  style={{
                    background: "rgba(255,255,255,.22)",
                    borderRadius: "999px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  LIVE UPDATE
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "32px",
                  marginTop: "28px",
                }}
              >
                <Progress label="ICU" value="92%" />
                <Progress label="GENERAL" value="68%" />
                <Progress label="POST-OP" value="45%" />
              </div>

              <div
                style={{
                  position: "absolute",
                  right: "20px",
                  bottom: "10px",
                  fontSize: "120px",
                  opacity: 0.1,
                }}
              >
                🏥
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "26px",
                border: "1px solid #edf2f7",
                boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "22px" }}>
                <h3 style={{ margin: 0 }}>Recent Activity</h3>
                <button style={linkBtn}>View Log</button>
              </div>

              <Activity color="#dc2626" title="Arrhythmia Alert: Bed #02" meta="3 mins ago • Dr. Chen notified" />
              <Activity color="#059669" title="Patient Admitted: Room 412" meta="14 mins ago • Intake procedure complete" />
              <Activity color="#3b82f6" title="Shift Changeover" meta="45 mins ago • Nurse Team B took over" />
            </div>
          </div>
        </section>

        {showAdmitModal && (
          <div
            onClick={() => setShowAdmitModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.45)",
              zIndex: 9999,
              display: "grid",
              placeItems: "center",
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "520px",
                background: "#fff",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 25px 60px rgba(15,23,42,.22)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "28px" }}>Admit Patient</h2>
              <p style={{ color: "#64748b" }}>Add a new patient to the active directory.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Input label="Full Name" value={newPatient.name} onChange={(v) => setNewPatient({ ...newPatient, name: v })} />
                <Input label="Age" value={newPatient.age} onChange={(v) => setNewPatient({ ...newPatient, age: v })} />
                <Input label="Ward" value={newPatient.ward} onChange={(v) => setNewPatient({ ...newPatient, ward: v })} />
                <Input label="Bed" value={newPatient.bed} onChange={(v) => setNewPatient({ ...newPatient, bed: v })} />
              </div>

              <div style={{ display: "flex", justifyContent: "end", gap: "12px", marginTop: "22px" }}>
                <button onClick={() => setShowAdmitModal(false)} style={modalCancel}>
                  Cancel
                </button>
                <button onClick={handleAdmitPatient} style={modalSubmit}>
                  Admit Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function StatCard({ icon, label, value, red }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "18px 22px",
        minWidth: "150px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        border: "1px solid #edf2f7",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: red ? "#ffdada" : "#5ff0bd",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: "24px", fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "#fff" : "transparent",
        color: active ? "#003c8f" : "#64748b",
        borderRadius: "8px",
        padding: "10px 18px",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Progress({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "12px", letterSpacing: "1.5px", fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: 900 }}>{value}</div>
      <div style={{ height: "6px", background: "rgba(255,255,255,.25)", borderRadius: "999px" }}>
        <div style={{ width: value, height: "100%", background: "#fff", borderRadius: "999px" }} />
      </div>
    </div>
  );
}

function Activity({ color, title, meta }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, marginTop: "6px" }} />
      <div>
        <div style={{ fontWeight: 800, fontSize: "14px" }}>{title}</div>
        <div style={{ color: "#64748b", fontSize: "12px" }}>{meta}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label>
      <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "7px" }}>
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "46px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          padding: "0 14px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

const td = {
  padding: "22px 26px",
};

const linkBtn = {
  border: "none",
  background: "transparent",
  color: "#003c8f",
  fontWeight: 800,
  cursor: "pointer",
};

function pageBtn(active) {
  return {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    border: "none",
    background: active ? "#064aa2" : "transparent",
    color: active ? "#fff" : "#111827",
    fontWeight: 800,
    cursor: "pointer",
  };
}

const modalCancel = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  padding: "12px 20px",
  fontWeight: 800,
  cursor: "pointer",
};

const modalSubmit = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: "999px",
  padding: "12px 24px",
  fontWeight: 800,
  cursor: "pointer",
};