"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";

const wardData = {
  "icu-north": {
    id: "icu-north",
    name: "ICU North",
    type: "Critical Care Unit",
    capacity: 20,
    occupied: 18,
    status: "FULL",
    nurse: "Nurse Team A",
  },
  "general-b": {
    id: "general-b",
    name: "General Ward B",
    type: "Medical/Surgical",
    capacity: 40,
    occupied: 26,
    status: "AVAILABLE",
    nurse: "Nurse Team B",
  },
  maternity: {
    id: "maternity",
    name: "Maternity Wing",
    type: "Postpartum Care",
    capacity: 20,
    occupied: 17,
    status: "NEAR CAPACITY",
    nurse: "Nurse Team C",
  },
};

const initialPatients = [
  {
    id: "12345",
    initials: "JD",
    name: "Jonathan Davies",
    bed: "#04",
    status: "CRITICAL",
    doctor: "Dr. Sarah Chen",
  },
  {
    id: "102933",
    initials: "EM",
    name: "Elena Martinez",
    bed: "#12",
    status: "OBSERVATION",
    doctor: "Dr. Sarah Chen",
  },
  {
    id: "449102",
    initials: "RK",
    name: "Robert Kagawa",
    bed: "#40",
    status: "STABLE",
    doctor: "Dr. Chen",
  },
  {
    id: "990231",
    initials: "SW",
    name: "Sarah Williams",
    bed: "#02",
    status: "CRITICAL",
    doctor: "Dr. Sarah Chen",
  },
];

export default function WardDetailPage() {
  const router = useRouter();
  const params = useParams();

  const baseWard = wardData[params.id] || wardData["general-b"];

  const [ward, setWard] = useState(baseWard);
  const [patients, setPatients] = useState(initialPatients);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    name: ward.name,
    type: ward.type,
    capacity: ward.capacity,
    nurse: ward.nurse,
  });

  const [assignForm, setAssignForm] = useState({
    name: "",
    bed: "",
    status: "STABLE",
    doctor: "Dr. Sarah Chen",
  });

  const available = ward.capacity - ward.occupied;
  const occupancy = Math.round((ward.occupied / ward.capacity) * 100);

  const occupiedBedNumbers = useMemo(() => {
    return patients
      .map((p) => Number(String(p.bed).replace("#", "")))
      .filter(Boolean);
  }, [patients]);

  const handleExport = () => {
    const rows = [
      ["Ward", ward.name],
      ["Type", ward.type],
      ["Capacity", ward.capacity],
      ["Occupied", ward.occupied],
      ["Available", available],
      ["Occupancy", `${occupancy}%`],
      [],
      ["Patient", "Bed", "Status", "Doctor"],
      ...patients.map((p) => [p.name, p.bed, p.status, p.doctor]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${ward.name.replaceAll(" ", "-")}-report.csv`;
    a.click();

    URL.revokeObjectURL(url);
    toast.success("Ward report exported");
  };

  const handleSaveEdit = () => {
    setWard((prev) => ({
      ...prev,
      name: editForm.name,
      type: editForm.type,
      capacity: Number(editForm.capacity),
      nurse: editForm.nurse,
    }));

    setShowEdit(false);
    toast.success("Ward updated successfully");
  };

  const handleAssignPatient = () => {
    if (!assignForm.name || !assignForm.bed) {
      toast.error("Please enter patient name and bed");
      return;
    }

    const words = assignForm.name.trim().split(" ");
    const initials =
      ((words[0]?.[0] || "") + (words[1]?.[0] || words[0]?.[1] || "")).toUpperCase();

    const newPatient = {
      id: String(Date.now()),
      initials,
      name: assignForm.name,
      bed: assignForm.bed.startsWith("#") ? assignForm.bed : `#${assignForm.bed}`,
      status: assignForm.status,
      doctor: assignForm.doctor,
    };

    setPatients((prev) => [newPatient, ...prev]);
    setWard((prev) => ({ ...prev, occupied: Math.min(prev.occupied + 1, prev.capacity) }));
    setShowAssign(false);

    setAssignForm({
      name: "",
      bed: "",
      status: "STABLE",
      doctor: "Dr. Sarah Chen",
    });

    toast.success("Patient assigned successfully");
  };

  const handleBedClick = (bedNumber) => {
    const isOccupied = occupiedBedNumbers.includes(bedNumber);

    if (isOccupied) {
      toast(`Bed ${bedNumber} is occupied`);
    } else {
      setAssignForm((prev) => ({ ...prev, bed: `#${bedNumber}` }));
      setShowAssign(true);
      toast.success(`Bed ${bedNumber} selected`);
    }
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={container}>
          <div style={header}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <button onClick={() => router.push("/wards")} style={backBtn}>
                ←
              </button>
              <div>
                <p style={crumb}>Ward Management</p>
                <h1 style={title}>{ward.name}</h1>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button onClick={() => toast.success("Notifications opened")} style={iconBtn}>
                🔔
              </button>
              <button onClick={handleExport} style={secondaryBtn}>
                ⇩ Export
              </button>
              <button onClick={() => setShowEdit(true)} style={primaryBtn}>
                ✎ Edit Ward
              </button>
            </div>
          </div>

          <div style={topGrid}>
            <div style={heroCard}>
              <span style={badge}>{ward.status} ({occupancy}%)</span>
              <p style={heroLabel}>WARD OVERVIEW</p>
              <h2 style={heroTitle}>{ward.name}</h2>
              <p style={heroText}>
                {ward.type} • Managed by {ward.nurse}
              </p>

              <div style={heroMetrics}>
                <Metric label="CAPACITY" value={ward.capacity} />
                <Metric label="OCCUPIED" value={ward.occupied} />
                <Metric label="AVAILABLE" value={available} />
              </div>

              <div style={progressBg}>
                <div style={{ ...progressFill, width: `${occupancy}%` }} />
              </div>
            </div>

            <div style={sideCards}>
              <ActionCard
                icon="🔄"
                title="Transfer Queue"
                value="06"
                desc="Patients waiting for bed assignment"
                onClick={() => toast.success("Transfer queue opened")}
              />
              <ActionCard
                icon="⚠️"
                title="Urgent Actions"
                value={occupancy > 85 ? "03" : "01"}
                desc="Clinical actions requiring review"
                danger
                onClick={() => toast.success("Urgent actions opened")}
              />
            </div>
          </div>

          <div style={statsGrid}>
            <Stat label="NURSE RATIO" value="1:4" />
            <Stat label="AVG STAY" value="3.2d" />
            <Stat label="ROUND STATUS" value="Live" />
            <Stat label="CLEAN BEDS" value={Math.max(available - 1, 0)} />
          </div>

          <div style={mainGrid}>
            <div style={panel}>
              <div style={panelHead}>
                <div>
                  <h2 style={panelTitle}>Current Patients</h2>
                  <p style={panelText}>Patients currently assigned to this ward.</p>
                </div>

                <button onClick={() => setShowAssign(true)} style={primaryBtn}>
                  ＋ Assign Patient
                </button>
              </div>

              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  style={patientRow}
                >
                  <div style={avatar}>{patient.initials}</div>

                  <div>
                    <h3 style={patientName}>{patient.name}</h3>
                    <p style={patientMeta}>
                      Bed {patient.bed} • {patient.doctor}
                    </p>
                  </div>

                  <span style={statusBadge(patient.status)}>{patient.status}</span>
                </div>
              ))}
            </div>

            <aside style={{ display: "grid", gap: 20 }}>
              <div style={card}>
                <h3 style={cardTitle}>Bed Availability</h3>

                <div style={bedGrid}>
                  {Array.from({ length: Math.min(ward.capacity, 40) }).map((_, i) => {
                    const bedNo = i + 1;
                    const occupied = occupiedBedNumbers.includes(bedNo);

                    return (
                      <button
                        key={bedNo}
                        onClick={() => handleBedClick(bedNo)}
                        style={{
                          ...bedBtn,
                          background: occupied ? "#064aa2" : "#e2e8f0",
                          color: occupied ? "#fff" : "#334155",
                        }}
                      >
                        {bedNo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={card}>
                <h3 style={cardTitle}>Ward Protocol Notes</h3>
                <Bullet color="#064aa2" text="Prioritize critical patients for consultant review." />
                <Bullet color="#047857" text="Keep two beds reserved for emergency transfers." />
                <Bullet color="#cf171d" text="Escalate if occupancy remains above 90%." />
              </div>

              <div style={card}>
                <h3 style={cardTitle}>Shift Activity</h3>
                <Activity title="Morning rounds completed" time="08:45 AM" />
                <Activity title="Medication handover verified" time="10:20 AM" />
                <Activity title="Bed cleaning requested" time="11:05 AM" />
              </div>
            </aside>
          </div>
        </section>

        {showAssign && (
          <Modal title="Assign Patient" onClose={() => setShowAssign(false)}>
            <Input
              label="Patient Name"
              value={assignForm.name}
              onChange={(v) => setAssignForm({ ...assignForm, name: v })}
            />
            <Input
              label="Bed Number"
              value={assignForm.bed}
              onChange={(v) => setAssignForm({ ...assignForm, bed: v })}
            />

            <label style={label}>
              Status
              <select
                value={assignForm.status}
                onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                style={input}
              >
                <option>STABLE</option>
                <option>OBSERVATION</option>
                <option>CRITICAL</option>
              </select>
            </label>

            <Input
              label="Doctor"
              value={assignForm.doctor}
              onChange={(v) => setAssignForm({ ...assignForm, doctor: v })}
            />

            <div style={modalActions}>
              <button onClick={() => setShowAssign(false)} style={cancelBtn}>Cancel</button>
              <button onClick={handleAssignPatient} style={primaryBtn}>Assign Now</button>
            </div>
          </Modal>
        )}

        {showEdit && (
          <Modal title="Edit Ward" onClose={() => setShowEdit(false)}>
            <Input
              label="Ward Name"
              value={editForm.name}
              onChange={(v) => setEditForm({ ...editForm, name: v })}
            />
            <Input
              label="Ward Type"
              value={editForm.type}
              onChange={(v) => setEditForm({ ...editForm, type: v })}
            />
            <Input
              label="Capacity"
              value={editForm.capacity}
              onChange={(v) => setEditForm({ ...editForm, capacity: v })}
            />
            <Input
              label="Nurse Team"
              value={editForm.nurse}
              onChange={(v) => setEditForm({ ...editForm, nurse: v })}
            />

            <div style={modalActions}>
              <button onClick={() => setShowEdit(false)} style={cancelBtn}>Cancel</button>
              <button onClick={handleSaveEdit} style={primaryBtn}>Save Changes</button>
            </div>
          </Modal>
        )}
      </main>
    </AppShell>
  );
}

function Metric({ label, value }) {
  return (
    <div style={metricBox}>
      <p style={metricLabel}>{label}</p>
      <h3 style={metricValue}>{value}</h3>
    </div>
  );
}

function ActionCard({ icon, title, value, desc, danger, onClick }) {
  return (
    <button onClick={onClick} style={actionCard}>
      <div style={actionTop}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <strong style={{ fontSize: 34, color: danger ? "#cf171d" : "#064aa2" }}>{value}</strong>
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{title}</h3>
      <p style={{ margin: 0, color: "#64748b" }}>{desc}</p>
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statCard}>
      <p style={statLabel}>{label}</p>
      <h3 style={statValue}>{value}</h3>
    </div>
  );
}

function Bullet({ color, text }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 8 }} />
      <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function Activity({ title, time }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #edf2f7" }}>
      <strong>{title}</strong>
      <p style={{ margin: "5px 0 0", color: "#64748b" }}>{time}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} style={modalBox}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Input({ label: title, value, onChange }) {
  return (
    <label style={label}>
      {title}
      <input value={value} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  );
}

function statusBadge(status) {
  if (status === "CRITICAL") return { ...badgeSmall, background: "#ffd9d9", color: "#b91c1c" };
  if (status === "OBSERVATION") return { ...badgeSmall, background: "#dbe7ff", color: "#334155" };
  return { ...badgeSmall, background: "#dcfce7", color: "#047857" };
}

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#111827",
  overflowX: "hidden",
};

const container = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "24px",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  marginBottom: 24,
};

const crumb = { margin: 0, color: "#64748b", fontWeight: 700 };
const title = { margin: 0, fontSize: 34, fontWeight: 900 };
const backBtn = { border: "none", background: "transparent", fontSize: 34, cursor: "pointer" };
const iconBtn = { border: "none", background: "transparent", fontSize: 20, cursor: "pointer" };

const primaryBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 24px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 22px rgba(6,74,162,.20)",
};

const secondaryBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const topGrid = {
  display: "grid",
  gridTemplateColumns: "1.55fr .85fr",
  gap: 22,
  marginBottom: 22,
};

const heroCard = {
  background: "linear-gradient(135deg,#064aa2,#075ec9)",
  color: "#fff",
  borderRadius: 24,
  padding: 30,
  position: "relative",
  boxShadow: "0 18px 34px rgba(6,74,162,.24)",
};

const badge = {
  position: "absolute",
  right: 30,
  top: 30,
  background: "#5ff0bd",
  color: "#047857",
  borderRadius: "999px",
  padding: "12px 18px",
  fontWeight: 900,
};

const heroLabel = { letterSpacing: 4, fontWeight: 900 };
const heroTitle = { fontSize: 54, lineHeight: 1, margin: "18px 0 12px", fontWeight: 900 };
const heroText = { fontSize: 20, color: "#dbeafe", lineHeight: 1.5 };
const heroMetrics = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 28 };

const metricBox = {
  background: "rgba(255,255,255,.14)",
  borderRadius: 16,
  padding: 18,
};

const metricLabel = { margin: 0, letterSpacing: 2, fontSize: 11, fontWeight: 900 };
const metricValue = { margin: "8px 0 0", fontSize: 32 };
const progressBg = { height: 9, background: "rgba(255,255,255,.25)", borderRadius: 999, marginTop: 24 };
const progressFill = { height: "100%", background: "#fff", borderRadius: 999 };

const sideCards = { display: "grid", gap: 18 };
const actionCard = {
  textAlign: "left",
  border: "1px solid #e9eef5",
  background: "#fff",
  borderRadius: 20,
  padding: 24,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const actionTop = { display: "flex", justifyContent: "space-between", marginBottom: 16 };

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 18,
  marginBottom: 22,
};

const statCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 22,
  border: "1px solid #e9eef5",
};

const statLabel = { color: "#94a3b8", fontWeight: 900, letterSpacing: 2, margin: 0 };
const statValue = { color: "#064aa2", fontSize: 30, margin: "8px 0 0" };

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.45fr .85fr",
  gap: 22,
  alignItems: "start",
};

const panel = {
  background: "#fff",
  borderRadius: 22,
  border: "1px solid #e9eef5",
  overflow: "hidden",
};

const panelHead = {
  padding: 24,
  borderBottom: "1px solid #edf2f7",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};

const panelTitle = { margin: 0, fontSize: 26 };
const panelText = { margin: "8px 0 0", color: "#64748b" };

const patientRow = {
  padding: "20px 24px",
  borderBottom: "1px solid #edf2f7",
  display: "grid",
  gridTemplateColumns: "50px 1fr auto",
  alignItems: "center",
  gap: 16,
  cursor: "pointer",
};

const avatar = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#eef6ff",
  border: "1px solid #cbdbea",
  color: "#064aa2",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const patientName = { margin: 0, fontSize: 18 };
const patientMeta = { margin: "4px 0 0", color: "#64748b" };

const badgeSmall = {
  borderRadius: "999px",
  padding: "9px 14px",
  fontSize: 12,
  fontWeight: 900,
};

const card = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e9eef5",
};

const cardTitle = { margin: "0 0 18px", fontSize: 20 };

const bedGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5,1fr)",
  gap: 10,
};

const bedBtn = {
  height: 38,
  borderRadius: 9,
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  borderRadius: 22,
  padding: 26,
};

const label = {
  display: "block",
  fontSize: 13,
  fontWeight: 900,
  color: "#64748b",
  marginBottom: 14,
};

const input = {
  marginTop: 8,
  width: "100%",
  height: 46,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  boxSizing: "border-box",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 18,
};

const cancelBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
};