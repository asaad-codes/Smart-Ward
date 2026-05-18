"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const initialMeds = [
  {
    id: 1,
    time: "08:00",
    name: "Lisinopril",
    dose: "10mg Oral Tablet",
    patient: "Robert J. Harrison",
    location: "Room 402 • Bed A",
    status: "ADMINISTERED",
    section: "morning",
    completed: true,
    tag: "ADMINISTERED",
  },
  {
    id: 2,
    time: "12:00",
    name: "Warfarin",
    dose: "5mg Anticoagulant",
    patient: "Edward Anderson",
    location: "Room 412 • Bed C",
    status: "DUE NOW",
    section: "noon",
    completed: false,
    tag: "STAT ORDER",
    verify: "VERIFY ID",
  },
  {
    id: 3,
    time: "12:00",
    name: "Insulin Aspart",
    dose: "6 Units Subcutaneous",
    patient: "Sarah Lopez",
    location: "Room 408 • Bed B",
    status: "DUE NOW",
    section: "noon",
    completed: false,
    tag: "ROUTINE",
  },
  {
    id: 4,
    time: "18:00",
    name: "Atorvastatin",
    dose: "20mg",
    patient: "Linda Graham",
    location: "ROOM 405",
    status: "SCHEDULED",
    section: "evening",
    completed: false,
  },
  {
    id: 5,
    time: "18:00",
    name: "Furosemide",
    dose: "40mg",
    patient: "James Wu",
    location: "ROOM 402",
    status: "SCHEDULED",
    section: "evening",
    completed: false,
  },
];

export default function MedicationsPage() {
  const [meds, setMeds] = useState(initialMeds);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const [newMed, setNewMed] = useState({
    name: "",
    dose: "",
    patient: "",
    location: "",
    time: "12:00",
    tag: "ROUTINE",
  });

  const completed = meds.filter((m) => m.completed).length;
  const missedLate = meds.filter((m) => m.status === "MISSED").length;
  const dueToday = meds.length;

  const markAsGiven = (id) => {
    setMeds((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, completed: true, status: "ADMINISTERED" } : m
      )
    );
    toast.success("Medication marked as given");
  };

  const addMedication = () => {
    if (!newMed.name || !newMed.dose || !newMed.patient || !newMed.location) {
      toast.error("Please fill all fields");
      return;
    }

    const med = {
      id: Date.now(),
      time: newMed.time,
      name: newMed.name.trim(),
      dose: newMed.dose.trim(),
      patient: newMed.patient.trim(),
      location: newMed.location.trim(),
      tag: newMed.tag,
      status: "DUE NOW",
      section: newMed.time === "18:00" ? "evening" : newMed.time === "08:00" ? "morning" : "noon",
      completed: false,
    };

    setMeds((prev) => [med, ...prev]);
    setShowAddModal(false);
    setNewMed({
      name: "",
      dose: "",
      patient: "",
      location: "",
      time: "12:00",
      tag: "ROUTINE",
    });

    toast.success("Medication added successfully");
  };

  const submitAction = () => {
    if (!actionReason.trim()) {
      toast.error("Please enter action reason");
      return;
    }

    toast.success("Missed medication action recorded");
    setShowActionModal(false);
    setActionReason("");
  };

  const noonMeds = meds.filter((m) => m.section === "noon");
  const eveningMeds = meds.filter((m) => m.section === "evening");

  return (
    <AppShell>
      <main style={page}>
        <header style={topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <h1 style={pageTitle}>Medication Schedule</h1>
            <div style={dividerVertical} />
            <span style={{ color: "#64748b" }}>Monday, Oct 23</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => toast.success("Notifications opened")} style={iconBtn}>
              🔔
            </button>
            <button onClick={() => toast.success("Nurse profile opened")} style={avatarBtn}>
              👩‍⚕️
            </button>
            <button onClick={() => toast.success("User settings opened")} style={iconBtn}>
              ⚙️
            </button>
          </div>
        </header>

        <section style={container}>
          <div style={statsGrid}>
            <StatCard label="TOTAL DUE TODAY" value={dueToday} color="#064aa2" />
            <StatCard label="COMPLETED" value={completed} color="#047857" />
            <StatCard label="MISSED/LATE" value={String(missedLate).padStart(2, "0")} color="#cf171d" />

            <div style={activeWardCard}>
              <div>
                <p style={activeWardLabel}>ACTIVE WARD</p>
                <h2 style={activeWardTitle}>North Wing • B2</h2>
              </div>
              <div style={plusBlock}>✚</div>
            </div>
          </div>

          <TimelineHeader time="08:00" right="Morning Rounds • Completed" />

          <div style={administeredCard}>
            <div>
              <h3 style={fadedTitle}>Lisinopril</h3>
              <p style={fadedText}>10mg Oral Tablet</p>
              <p style={fadedText}>👤 Robert J. Harrison</p>
              <p style={fadedText}>🏥 Room 402 • Bed A</p>
            </div>
            <span style={adminBadge}>ADMINISTERED</span>
          </div>

          <TimelineHeader time="12:00" right="● DUE NOW" active />

          <div style={mainGrid}>
            {noonMeds.slice(0, 2).map((med) => (
              <MedicationCard key={med.id} med={med} onMark={() => markAsGiven(med.id)} />
            ))}
          </div>

          <div style={{ position: "relative", height: 20 }}>
            <button onClick={() => setShowAddModal(true)} style={floatingAdd}>
              ＋
            </button>
          </div>

          <TimelineHeader time="18:00" right="Evening Rounds • Scheduled" />

          <div style={bottomGrid}>
            <div>
              <div style={alertBox}>
                <div style={alertIcon}>⚠</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", color: "#b91c1c" }}>
                    Unresolved Missed Medication
                  </h3>
                  <p style={{ margin: 0, color: "#b91c1c" }}>
                    Metformin (500mg) for Patient James Wu was missed at 08:00.
                  </p>
                </div>
                <button onClick={() => setShowActionModal(true)} style={actionBtn}>
                  Action
                  <br />
                  Now
                </button>
              </div>

              <div style={smallMedGrid}>
                {eveningMeds.map((m) => (
                  <SmallMedCard
                    key={m.id}
                    med={m}
                    onMenu={() => toast.success(`${m.name} options opened`)}
                  />
                ))}
              </div>
            </div>

            <aside style={protocolCard}>
              <h3 style={protocolTitle}>WARD PROTOCOL NOTES</h3>

              <Bullet
                color="#064aa2"
                text="Ensure dual-verification for all anticoagulants in the 12:00 window."
              />
              <Bullet
                color="#047857"
                text="Check blood glucose levels prior to administering Insulin Aspart for Bed 408B."
              />

              <div style={protocolLine} />

              <div style={inventoryRow}>
                <strong>Inventory Status</strong>
                <strong style={{ color: "#003c8f" }}>Good</strong>
              </div>

              <div style={inventoryBg}>
                <div style={inventoryFill} />
              </div>
            </aside>
          </div>
        </section>

        {showAddModal && (
          <Modal title="Add Medication" onClose={() => setShowAddModal(false)}>
            <Input
              label="Medication Name"
              value={newMed.name}
              onChange={(v) => setNewMed({ ...newMed, name: v })}
              placeholder="e.g. Paracetamol"
            />
            <Input
              label="Dose"
              value={newMed.dose}
              onChange={(v) => setNewMed({ ...newMed, dose: v })}
              placeholder="e.g. 500mg Tablet"
            />
            <Input
              label="Patient Name"
              value={newMed.patient}
              onChange={(v) => setNewMed({ ...newMed, patient: v })}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Location"
              value={newMed.location}
              onChange={(v) => setNewMed({ ...newMed, location: v })}
              placeholder="e.g. Room 402 • Bed A"
            />

            <label style={modalLabel}>
              Time
              <select
                value={newMed.time}
                onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                style={modalInput}
              >
                <option>08:00</option>
                <option>12:00</option>
                <option>18:00</option>
              </select>
            </label>

            <label style={modalLabel}>
              Type
              <select
                value={newMed.tag}
                onChange={(e) => setNewMed({ ...newMed, tag: e.target.value })}
                style={modalInput}
              >
                <option>ROUTINE</option>
                <option>STAT ORDER</option>
                <option>PRN</option>
              </select>
            </label>

            <div style={modalActions}>
              <button onClick={() => setShowAddModal(false)} style={cancelBtn}>
                Cancel
              </button>
              <button onClick={addMedication} style={primaryBtn}>
                Add Medication
              </button>
            </div>
          </Modal>
        )}

        {showActionModal && (
          <Modal title="Missed Medication Action" onClose={() => setShowActionModal(false)}>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              Explain why the medication was missed and record the action taken.
            </p>

            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Patient refused, unavailable, or staff busy..."
              style={textarea}
            />

            <div style={modalActions}>
              <button onClick={() => setShowActionModal(false)} style={cancelBtn}>
                Cancel
              </button>
              <button onClick={submitAction} style={primaryBtn}>
                Submit Action
              </button>
            </div>
          </Modal>
        )}
      </main>
    </AppShell>
  );
}

function TimelineHeader({ time, right, active }) {
  return (
    <div style={timeline}>
      <span style={active ? timePillActive : timePill}>{time}</span>
      <div style={timelineLine} />
      <span style={active ? dueNow : timelineRight}>{right}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...statCard, borderLeft: `4px solid ${color}` }}>
      <p style={statLabel}>{label}</p>
      <h2 style={{ ...statValue, color }}>{value}</h2>
    </div>
  );
}

function MedicationCard({ med, onMark }) {
  return (
    <div style={medCard}>
      <div style={medCardTop}>
        <div style={pillIcon}>💊</div>
        <div>
          <h2 style={medTitle}>{med.name}</h2>
          <p style={medDose}>{med.dose}</p>
        </div>

        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <span style={statOrder}>{med.completed ? "GIVEN" : med.tag}</span>
          {med.verify && <p style={verifyText}>{med.verify}</p>}
        </div>
      </div>

      <div style={patientInfo}>
        <div style={patientAvatar}>👩‍⚕️</div>
        <div>
          <p style={infoLabel}>PATIENT</p>
          <strong>{med.patient}</strong>
        </div>
        <div>
          <p style={infoLabel}>LOCATION</p>
          <strong>{med.location}</strong>
        </div>
      </div>

      <button
        onClick={onMark}
        disabled={med.completed}
        style={{
          ...markBtn,
          opacity: med.completed ? 0.55 : 1,
          cursor: med.completed ? "not-allowed" : "pointer",
        }}
      >
        ✓ {med.completed ? "Given" : "Mark as Given"}
      </button>
    </div>
  );
}

function SmallMedCard({ med, onMenu }) {
  return (
    <div style={smallMedCard}>
      <div style={smallTop}>
        <h3 style={{ margin: 0 }}>{med.name}</h3>
        <span style={{ color: "#8ca0ba", fontWeight: 800 }}>{med.dose}</span>
      </div>

      <p style={smallPatient}>👤 {med.patient}</p>

      <div style={smallBottom}>
        <span style={roomTag}>{med.location}</span>
        <button onClick={onMenu} style={menuBtn}>
          ⋮
        </button>
      </div>
    </div>
  );
}

function Bullet({ color, text }) {
  return (
    <div style={bulletRow}>
      <span style={{ ...bulletDot, background: color }} />
      <p style={{ margin: 0, color: "#475569", lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} style={modalBox}>
        <h2 style={{ margin: "0 0 16px", fontSize: 28 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label style={modalLabel}>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={modalInput}
      />
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
  height: 70,
  background: "#f8fbff",
  borderBottom: "1px solid #e6edf5",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 30px",
};

const pageTitle = {
  margin: 0,
  fontSize: 24,
  color: "#003c8f",
  fontWeight: 900,
};

const dividerVertical = {
  width: 1,
  height: 28,
  background: "#dbe3ee",
};

const iconBtn = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
};

const avatarBtn = {
  border: "none",
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#dbeafe",
  cursor: "pointer",
};

const container = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "28px 30px 40px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 22,
  marginBottom: 42,
};

const statCard = {
  background: "#fff",
  borderRadius: 16,
  padding: "24px 26px",
  minHeight: 100,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: 2,
  lineHeight: 1.5,
};

const statValue = {
  margin: "10px 0 0",
  fontSize: 34,
  fontWeight: 900,
};

const activeWardCard = {
  background: "#064aa2",
  color: "#fff",
  borderRadius: 16,
  padding: "24px 26px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 10px 24px rgba(6,74,162,.22)",
};

const activeWardLabel = {
  margin: 0,
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: 2,
};

const activeWardTitle = {
  margin: "10px 0 0",
  fontSize: 25,
  lineHeight: 1.25,
};

const plusBlock = {
  width: 58,
  height: 58,
  borderRadius: 12,
  background: "rgba(255,255,255,.15)",
  display: "grid",
  placeItems: "center",
  fontSize: 36,
};

const timeline = {
  display: "grid",
  gridTemplateColumns: "80px 1fr auto",
  alignItems: "center",
  gap: 16,
  marginBottom: 20,
};

const timePill = {
  background: "#e5e7eb",
  color: "#334155",
  padding: "9px 18px",
  borderRadius: 999,
  fontWeight: 900,
  textAlign: "center",
};

const timePillActive = {
  ...timePill,
  background: "#064aa2",
  color: "#fff",
  boxShadow: "0 6px 14px rgba(6,74,162,.22)",
};

const timelineLine = {
  height: 1,
  background: "#cbd5e1",
};

const timelineRight = {
  color: "#8ca0ba",
  fontSize: 14,
};

const dueNow = {
  color: "#003c8f",
  fontWeight: 900,
  fontSize: 14,
};

const administeredCard = {
  background: "#eef0f3",
  borderRadius: 16,
  padding: 24,
  width: 260,
  minHeight: 120,
  marginBottom: 44,
  opacity: 0.7,
};

const fadedTitle = {
  margin: 0,
  color: "#64748b",
};

const fadedText = {
  margin: "8px 0",
  color: "#8ca0ba",
};

const adminBadge = {
  background: "#bbf7d0",
  color: "#047857",
  padding: "7px 14px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 26,
  marginBottom: 34,
};

const medCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 30,
  border: "1px solid #dbe3ee",
  boxShadow: "0 12px 28px rgba(15,23,42,.05)",
};

const medCardTop = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginBottom: 28,
};

const pillIcon = {
  width: 54,
  height: 54,
  borderRadius: 14,
  background: "#dbeafe",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
};

const medTitle = {
  margin: 0,
  color: "#003c8f",
  fontSize: 26,
  fontWeight: 900,
};

const medDose = {
  margin: "6px 0 0",
  color: "#334155",
};

const statOrder = {
  background: "#064aa2",
  color: "#fff",
  padding: "7px 18px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const verifyText = {
  margin: "8px 0 0",
  color: "#8ca0ba",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 2,
};

const patientInfo = {
  borderTop: "1px solid #edf2f7",
  borderBottom: "1px solid #edf2f7",
  padding: "18px 0",
  display: "grid",
  gridTemplateColumns: "44px 1fr 1fr",
  alignItems: "center",
  gap: 12,
};

const patientAvatar = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#ccfbf1",
  display: "grid",
  placeItems: "center",
};

const infoLabel = {
  margin: "0 0 4px",
  color: "#8ca0ba",
  fontSize: 11,
  fontWeight: 900,
};

const markBtn = {
  marginTop: 24,
  width: "100%",
  height: 62,
  borderRadius: 999,
  border: "none",
  background: "#064aa2",
  color: "#fff",
  fontWeight: 900,
  fontSize: 17,
  boxShadow: "0 10px 20px rgba(6,74,162,.18)",
};

const floatingAdd = {
  position: "absolute",
  right: 8,
  top: -22,
  width: 60,
  height: 60,
  borderRadius: "50%",
  border: "none",
  background: "#064aa2",
  color: "#fff",
  fontSize: 34,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(6,74,162,.28)",
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "1.7fr .8fr",
  gap: 24,
};

const alertBox = {
  background: "#ffd8d4",
  borderLeft: "4px solid #cf171d",
  borderRadius: 16,
  padding: 24,
  display: "flex",
  alignItems: "center",
  gap: 18,
  marginBottom: 24,
};

const alertIcon = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "#cf171d",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
  fontWeight: 900,
};

const actionBtn = {
  border: "none",
  background: "#c5161d",
  color: "#fff",
  borderRadius: 999,
  padding: "14px 28px",
  fontWeight: 900,
  cursor: "pointer",
};

const smallMedGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
};

const smallMedCard = {
  background: "#eef0f3",
  borderRadius: 16,
  padding: 24,
  minHeight: 150,
};

const smallTop = {
  display: "flex",
  justifyContent: "space-between",
};

const smallPatient = {
  color: "#475569",
  marginTop: 28,
};

const smallBottom = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const roomTag = {
  background: "#dbe3ee",
  color: "#334155",
  borderRadius: 4,
  padding: "5px 8px",
  fontSize: 11,
  fontWeight: 900,
};

const menuBtn = {
  border: "none",
  background: "transparent",
  fontSize: 22,
  cursor: "pointer",
  color: "#64748b",
};

const protocolCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 28,
  border: "1px solid #e9eef5",
};

const protocolTitle = {
  color: "#475569",
  letterSpacing: 3,
  fontSize: 16,
};

const bulletRow = {
  display: "flex",
  gap: 12,
  marginBottom: 18,
};

const bulletDot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  marginTop: 8,
  flexShrink: 0,
};

const protocolLine = {
  height: 1,
  background: "#edf2f7",
  margin: "26px 0",
};

const inventoryRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 16,
};

const inventoryBg = {
  height: 7,
  background: "#e2e8f0",
  borderRadius: 999,
};

const inventoryFill = {
  width: "82%",
  height: "100%",
  background: "#064aa2",
  borderRadius: 999,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
  overflowY: "auto",
};

const modalBox = {
  width: "100%",
  maxWidth: 520,
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 25px 60px rgba(15,23,42,.25)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalLabel = {
  display: "block",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 14,
};

const modalInput = {
  marginTop: 8,
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  boxSizing: "border-box",
};

const textarea = {
  width: "100%",
  minHeight: 120,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 14,
  resize: "none",
  boxSizing: "border-box",
};

const modalActions = {
  position: "sticky",
  bottom: 0,
  background: "#fff",
  paddingTop: 12,
  marginTop: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const cancelBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: 999,
  height: 48,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  height: 48,
  padding: "0 24px",
  fontWeight: 900,
  cursor: "pointer",
};