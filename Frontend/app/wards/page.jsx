"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const defaultWards = [
  {
    id: "icu-north",
    name: "ICU North",
    type: "Critical Care Unit",
    capacity: 20,
    occupied: 18,
    status: "FULL",
  },
  {
    id: "general-b",
    name: "General Ward B",
    type: "Medical/Surgical",
    capacity: 40,
    occupied: 26,
    status: "AVAILABLE",
  },
  {
    id: "maternity",
    name: "Maternity Wing",
    type: "Postpartum Care",
    capacity: 20,
    occupied: 17,
    status: "NEAR CAPACITY",
  },
  {
    id: "emergency",
    name: "Emergency Dept",
    type: "Acute Care",
    capacity: 25,
    occupied: 24,
    status: "CRITICAL",
  },
  {
    id: "cardiac",
    name: "Cardiac Center",
    type: "Specialized Care",
    capacity: 30,
    occupied: 12,
    status: "AVAILABLE",
  },
  {
    id: "pediatric",
    name: "Pediatric Wing",
    type: "Child Healthcare",
    capacity: 32,
    occupied: 25,
    status: "NEAR CAPACITY",
  },
];

function getWardStyle(status) {
  const s = String(status || "").toUpperCase();

  if (s === "FULL" || s === "CRITICAL") {
    return {
      border: "#dc2626",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      bar: "#dc2626",
      softBg: "#fff7f7",
    };
  }

  if (s === "NEAR CAPACITY") {
    return {
      border: "#f59e0b",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      bar: "#f59e0b",
      softBg: "#fffbeb",
    };
  }

  return {
    border: "#059669",
    badgeBg: "#dcfce7",
    badgeColor: "#047857",
    bar: "#059669",
    softBg: "#f0fdf4",
  };
}

export default function WardsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [wards, setWards] = useState(defaultWards);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newWard, setNewWard] = useState({
    name: "",
    type: "",
    capacity: "",
    occupied: "",
    status: "AVAILABLE",
  });

  const filteredWards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return wards;

    return wards.filter(
      (ward) =>
        ward.name.toLowerCase().includes(q) ||
        ward.type.toLowerCase().includes(q) ||
        ward.status.toLowerCase().includes(q)
    );
  }, [search, wards]);

  const totalCapacity = wards.reduce(
    (sum, w) => sum + Number(w.capacity || 0),
    0
  );

  const occupiedBeds = wards.reduce(
    (sum, w) => sum + Number(w.occupied || 0),
    0
  );

  const availableBeds = totalCapacity - occupiedBeds;

  const globalOccupancy = totalCapacity
    ? Math.round((occupiedBeds / totalCapacity) * 100)
    : 0;

  const urgentActions = wards.filter((w) =>
    ["FULL", "CRITICAL"].includes(w.status)
  ).length;

  const handleAddWard = () => {
    if (!newWard.name || !newWard.type || !newWard.capacity) {
      toast.error("Please fill ward name, type and capacity");
      return;
    }

    const capacity = Number(newWard.capacity);
    const occupied = Number(newWard.occupied || 0);

    if (capacity <= 0) {
      toast.error("Capacity must be greater than 0");
      return;
    }

    if (occupied > capacity) {
      toast.error("Occupied beds cannot be more than capacity");
      return;
    }

    const ward = {
      id: newWard.name.toLowerCase().trim().replaceAll(" ", "-"),
      name: newWard.name.trim(),
      type: newWard.type.trim(),
      capacity,
      occupied,
      status: newWard.status,
    };

    setWards((prev) => [ward, ...prev]);
    setShowAddModal(false);

    setNewWard({
      name: "",
      type: "",
      capacity: "",
      occupied: "",
      status: "AVAILABLE",
    });

    toast.success("Ward added successfully");

    setTimeout(() => {
      router.push(`/wards/${ward.id}`);
    }, 700);
  };

  const handleDeleteWard = (id) => {
    setWards((prev) => prev.filter((ward) => ward.id !== id));
    toast.success("Ward removed");
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={container}>
          {/* Hero */}
          <div style={heroCard}>
            <div style={heroGlowOne} />
            <div style={heroGlowTwo} />

            <div style={heroContent}>
              <div>
                <div style={heroBadge}>SMARTWARD BED CONTROL</div>

                <h1 style={heroTitle}>Ward Management</h1>

                <p style={heroSubtitle}>
                  Monitor ward capacity, bed occupancy, urgent departments, and
                  available spaces in one clean clinical workspace.
                </p>
              </div>

              <button onClick={() => setShowAddModal(true)} style={heroButton}>
                ＋ Add Ward
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={toolbar}>
            <div style={searchBox}>
              <span style={{ color: "#64748b", fontSize: 15 }}>🔍</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ward name, type, or status..."
                style={searchInput}
              />
            </div>

            <div style={summaryPill}>
              <span style={summaryDot} />
              {filteredWards.length} wards showing
            </div>
          </div>

          {/* Stats */}
          <div style={statsGrid}>
            <StatCard
              label="Total Wards"
              value={wards.length}
              code="WD"
              color="#2563eb"
              bg="#eff6ff"
            />

            <StatCard
              label="Global Occupancy"
              value={`${globalOccupancy}%`}
              code="OC"
              color="#059669"
              bg="#ecfdf5"
            />

            <StatCard
              label="Beds Available"
              value={availableBeds}
              code="BD"
              color="#0ea5e9"
              bg="#e0f2fe"
            />

            <StatCard
              label="Urgent Actions"
              value={urgentActions}
              code="!"
              color="#dc2626"
              bg="#fef2f2"
            />
          </div>

          {/* Ward Cards */}
          <div style={wardGrid}>
            {filteredWards.map((ward) => (
              <WardCard
                key={ward.id}
                ward={ward}
                onView={() => router.push(`/wards/${ward.id}`)}
                onEdit={() => toast.success(`${ward.name} edit opened`)}
                onDelete={() => handleDeleteWard(ward.id)}
              />
            ))}
          </div>

          {filteredWards.length === 0 && (
            <div style={emptyBox}>No ward found.</div>
          )}

          {/* Threshold Box */}
          <div style={thresholdBox}>
            <div>
              <p style={sectionEyebrow}>CAPACITY GUIDE</p>

              <h3 style={thresholdTitle}>Capacity Thresholds</h3>

              <p style={thresholdText}>
                These indicators help staff monitor patient flow, bed pressure,
                and transfer priority across the hospital.
              </p>
            </div>

            <div style={legendWrap}>
              <Legend color="#059669" text="Available" />
              <Legend color="#f59e0b" text="Near Capacity" />
              <Legend color="#dc2626" text="Full / Critical" />
            </div>
          </div>
        </section>

        {/* Add Ward Modal */}
        {showAddModal && (
          <div onClick={() => setShowAddModal(false)} style={modalOverlay}>
            <div onClick={(e) => e.stopPropagation()} style={modalBox}>
              <div style={modalHeader}>
                <div>
                  <p style={sectionEyebrow}>NEW WARD</p>
                  <h2 style={modalTitle}>Add New Ward</h2>
                  <p style={modalSubtitle}>
                    Create a new ward and add it to the management list.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  style={closeBtn}
                >
                  ×
                </button>
              </div>

              <Input
                label="Ward Name"
                placeholder="e.g. Surgical Ward C"
                value={newWard.name}
                onChange={(v) => setNewWard({ ...newWard, name: v })}
              />

              <Input
                label="Ward Type"
                placeholder="e.g. Surgical Care"
                value={newWard.type}
                onChange={(v) => setNewWard({ ...newWard, type: v })}
              />

              <div style={modalGrid}>
                <Input
                  label="Capacity"
                  placeholder="40"
                  type="number"
                  value={newWard.capacity}
                  onChange={(v) => setNewWard({ ...newWard, capacity: v })}
                />

                <Input
                  label="Occupied Beds"
                  placeholder="0"
                  type="number"
                  value={newWard.occupied}
                  onChange={(v) => setNewWard({ ...newWard, occupied: v })}
                />
              </div>

              <label style={label}>
                Status
                <select
                  value={newWard.status}
                  onChange={(e) =>
                    setNewWard({ ...newWard, status: e.target.value })
                  }
                  style={input}
                >
                  <option>AVAILABLE</option>
                  <option>NEAR CAPACITY</option>
                  <option>FULL</option>
                  <option>CRITICAL</option>
                </select>
              </label>

              <div style={modalActions}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={cancelBtn}
                >
                  Cancel
                </button>

                <button onClick={handleAddWard} style={primaryBtn}>
                  Add New Ward
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function WardCard({ ward, onView, onEdit, onDelete }) {
  const usedPercent = Math.round((ward.occupied / ward.capacity) * 100);
  const available = ward.capacity - ward.occupied;
  const style = getWardStyle(ward.status);

  return (
    <div
      style={{
        ...wardCard,
        borderTop: `5px solid ${style.border}`,
      }}
    >
      <div style={wardHead}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              ...wardIcon,
              background: style.softBg,
              color: style.border,
            }}
          >
            {ward.name.slice(0, 2).toUpperCase()}
          </div>

          <h2 style={wardTitle}>{ward.name}</h2>

          <div style={wardType}>{ward.type}</div>
        </div>

        <span
          style={{
            ...wardBadge,
            background: style.badgeBg,
            color: style.badgeColor,
          }}
        >
          {ward.status}
        </span>
      </div>

      <div style={capacityRow}>
        <div style={capacityBox}>
          <div style={miniLabel}>OCCUPIED</div>

          <div style={capacityNumber}>
            {ward.occupied}
            <span style={capacityMuted}> / {ward.capacity}</span>
          </div>
        </div>

        <div style={{ ...capacityBox, textAlign: "right" }}>
          <div style={miniLabel}>AVAILABLE</div>

          <div
            style={{
              ...capacityNumber,
              color: available <= 2 ? "#dc2626" : "#059669",
            }}
          >
            {available}
          </div>
        </div>
      </div>

      <div style={progressTop}>
        <span style={progressLabel}>Bed Usage</span>
        <span style={{ ...progressValue, color: style.border }}>
          {usedPercent}%
        </span>
      </div>

      <div style={progressBg}>
        <div
          style={{
            ...progressFill,
            width: `${usedPercent}%`,
            background: style.bar,
          }}
        />
      </div>

      <div style={cardActions}>
        <button onClick={onView} style={viewBtn}>
          View Details
        </button>

        <button onClick={onEdit} style={editBtn}>
          Edit
        </button>

        <button onClick={onDelete} style={deleteBtn}>
          Delete
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, code, color, bg }) {
  return (
    <div style={statCard}>
      <div style={statCircleBg} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ ...statCode, background: bg, color }}>{code}</div>

        <div style={{ ...statValue, color }}>{value}</div>

        <div style={statLabel}>{label}</div>
      </div>
    </div>
  );
}

function Legend({ color, text }) {
  return (
    <div style={legend}>
      <span style={{ ...legendDot, background: color }} />
      {text}
    </div>
  );
}

function Input({ label: title, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={label}>
      {title}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </label>
  );
}

/* Styles */

const page = {
  minHeight: "calc(100vh - 42px)",
  background:
    "radial-gradient(circle at top left, #dbeafe 0%, transparent 34%), radial-gradient(circle at top right, #ccfbf1 0%, transparent 30%), #f3f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
  overflowX: "hidden",
};

const container = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "24px",
};

const heroCard = {
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, #063b86 0%, #0b4aa2 48%, #0f766e 100%)",
  borderRadius: "30px",
  padding: "30px",
  marginBottom: "20px",
  color: "#ffffff",
  boxShadow: "0 24px 70px rgba(11,74,162,0.24)",
};

const heroGlowOne = {
  position: "absolute",
  width: "260px",
  height: "260px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.13)",
  top: "-110px",
  right: "-80px",
};

const heroGlowTwo = {
  position: "absolute",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background: "rgba(125,211,252,0.18)",
  bottom: "-115px",
  left: "48%",
};

const heroContent = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const heroBadge = {
  display: "inline-flex",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "999px",
  padding: "7px 13px",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "1.5px",
  marginBottom: "16px",
};

const heroTitle = {
  margin: 0,
  fontSize: "38px",
  lineHeight: 1.08,
  fontWeight: "900",
  letterSpacing: "-1.3px",
};

const heroSubtitle = {
  margin: "10px 0 0",
  color: "#dbeafe",
  fontSize: "14px",
  lineHeight: 1.75,
  maxWidth: "640px",
};

const heroButton = {
  border: "none",
  background: "#ffffff",
  color: "#0b4aa2",
  borderRadius: "18px",
  minHeight: "50px",
  padding: "0 22px",
  fontSize: "13px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(15,23,42,0.15)",
  whiteSpace: "nowrap",
};

const toolbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const searchBox = {
  width: "100%",
  maxWidth: "520px",
  height: "48px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  gap: "10px",
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  fontSize: "13px",
  color: "#334155",
};

const summaryPill = {
  height: "42px",
  borderRadius: "999px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "12px",
  fontWeight: "800",
  color: "#475569",
  whiteSpace: "nowrap",
};

const summaryDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#22c55e",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const statCard = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "24px",
  padding: "18px",
  minHeight: "132px",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
};

const statCircleBg = {
  position: "absolute",
  right: "-28px",
  top: "-32px",
  width: "96px",
  height: "96px",
  borderRadius: "50%",
  background: "#f1f5f9",
};

const statCode = {
  width: "42px",
  height: "42px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const statValue = {
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: "900",
  letterSpacing: "-0.8px",
};

const statLabel = {
  marginTop: "8px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "850",
};

const wardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
  gap: "18px",
  marginBottom: "22px",
};

const wardCard = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const wardHead = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "12px",
  alignItems: "start",
  marginBottom: "18px",
};

const wardIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "13px",
};

const wardTitle = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.15,
  fontWeight: "900",
  letterSpacing: "-0.6px",
  wordBreak: "break-word",
};

const wardType = {
  marginTop: "7px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "850",
  letterSpacing: "1.4px",
  textTransform: "uppercase",
  lineHeight: 1.5,
};

const wardBadge = {
  minHeight: "30px",
  padding: "7px 11px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  fontWeight: "900",
  textAlign: "center",
  lineHeight: 1.15,
  whiteSpace: "nowrap",
};

const capacityRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "16px",
};

const capacityBox = {
  background: "#f8fafc",
  border: "1px solid #edf2f7",
  borderRadius: "18px",
  padding: "13px",
};

const miniLabel = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  marginBottom: "7px",
};

const capacityNumber = {
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: "900",
};

const capacityMuted = {
  color: "#cbd5e1",
  fontWeight: "650",
};

const progressTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const progressLabel = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "800",
};

const progressValue = {
  fontSize: "11px",
  fontWeight: "900",
};

const progressBg = {
  height: "9px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "18px",
};

const progressFill = {
  height: "100%",
  borderRadius: "999px",
};

const cardActions = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: "10px",
  alignItems: "center",
};

const viewBtn = {
  height: "38px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#0b4aa2",
  borderRadius: "13px",
  fontWeight: "900",
  cursor: "pointer",
  fontSize: "12px",
};

const editBtn = {
  height: "38px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#475569",
  borderRadius: "13px",
  fontWeight: "850",
  cursor: "pointer",
  fontSize: "12px",
  padding: "0 13px",
};

const deleteBtn = {
  height: "38px",
  border: "1px solid #fecaca",
  background: "#fff7f7",
  color: "#dc2626",
  borderRadius: "13px",
  fontWeight: "850",
  cursor: "pointer",
  fontSize: "12px",
  padding: "0 13px",
};

const thresholdBox = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const sectionEyebrow = {
  margin: "0 0 6px",
  fontSize: "10px",
  letterSpacing: "1.8px",
  fontWeight: "900",
  color: "#0b4aa2",
};

const thresholdTitle = {
  margin: "0 0 7px",
  fontSize: "18px",
  fontWeight: "900",
};

const thresholdText = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
  maxWidth: "530px",
};

const legendWrap = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const legend = {
  background: "#f8fafc",
  border: "1px solid #edf2f7",
  borderRadius: "999px",
  padding: "9px 13px",
  fontSize: "11px",
  fontWeight: "900",
  color: "#475569",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const legendDot = {
  width: "9px",
  height: "9px",
  borderRadius: "50%",
};

const emptyBox = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "34px",
  textAlign: "center",
  color: "#64748b",
  fontWeight: "850",
  marginBottom: "24px",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.48)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
  overflowY: "auto",
};

const modalBox = {
  width: "100%",
  maxWidth: "540px",
  background: "#ffffff",
  borderRadius: "26px",
  padding: "26px",
  boxShadow: "0 25px 70px rgba(15,23,42,.26)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const modalTitle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "900",
  letterSpacing: "-0.8px",
};

const modalSubtitle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
};

const closeBtn = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#475569",
  fontSize: "22px",
  fontWeight: "800",
  cursor: "pointer",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const label = {
  display: "block",
  fontSize: "12px",
  fontWeight: "900",
  color: "#475569",
  marginBottom: "14px",
};

const input = {
  marginTop: "8px",
  width: "100%",
  height: "46px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  outline: "none",
  boxSizing: "border-box",
  fontSize: "13px",
  color: "#0f172a",
};

const modalActions = {
  position: "sticky",
  bottom: 0,
  background: "#ffffff",
  paddingTop: "12px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const primaryBtn = {
  border: "none",
  background: "#0b4aa2",
  color: "#ffffff",
  borderRadius: "15px",
  minHeight: "46px",
  padding: "0 20px",
  fontWeight: "900",
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(11,74,162,.22)",
};

const cancelBtn = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  borderRadius: "15px",
  minHeight: "46px",
  padding: "0 18px",
  fontWeight: "900",
  cursor: "pointer",
};