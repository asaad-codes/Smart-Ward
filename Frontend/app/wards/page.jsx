"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const WARD_API = `${API_BASE_URL}/ward`; 

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("smartward_token");
} 

function authConfig() {
  return {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  };
}

function mapWard(ward) {
  const id = ward._id || ward.id;

  return {
    id: String(id),
    name: ward.name || "Unnamed Ward",
    type: ward.type || "General Ward",
    capacity: Number(ward.capacity || 0),
    occupied: Number(ward.occupied || 0),
    floor: ward.floor || "Floor 1",
    status: ward.status || "AVAILABLE",
  };
}

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
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWard, setEditingWard] = useState(null);

  const [wardForm, setWardForm] = useState({
    name: "",
    type: "",
    capacity: "",
    occupied: "",
    floor: "",
    status: "AVAILABLE",
  });

  const fetchWards = async () => {
    try {
      const token = getToken();

      if (!token) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      setLoading(true);

      const response = await axios.get(`${WARD_API}/getwards`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setWards(data.map(mapWard));
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch wards.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const filteredWards = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return wards;

    return wards.filter(
      (ward) =>
        ward.name.toLowerCase().includes(q) ||
        ward.type.toLowerCase().includes(q) ||
        ward.floor.toLowerCase().includes(q) ||
        ward.status.toLowerCase().includes(q)
    );
  }, [search, wards]);

  const totalCapacity = wards.reduce(
    (sum, ward) => sum + Number(ward.capacity || 0),
    0
  );

  const occupiedBeds = wards.reduce(
    (sum, ward) => sum + Number(ward.occupied || 0),
    0
  );

  const availableBeds = totalCapacity - occupiedBeds;

  const globalOccupancy = totalCapacity
    ? Math.round((occupiedBeds / totalCapacity) * 100)
    : 0;

  const urgentActions = wards.filter((ward) =>
    ["FULL", "CRITICAL"].includes(ward.status)
  ).length;

  const resetForm = () => {
    setWardForm({
      name: "",
      type: "",
      capacity: "",
      occupied: "",
      floor: "",
      status: "AVAILABLE",
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingWard(null);
    setShowAddModal(true);
  };

  const openEditModal = (ward) => {
    setEditingWard(ward);

    setWardForm({
      name: ward.name,
      type: ward.type,
      capacity: ward.capacity,
      occupied: ward.occupied,
      floor: ward.floor,
      status: ward.status,
    });

    setShowEditModal(true);
  };

  const validateWardForm = () => {
    if (!wardForm.name || !wardForm.type || !wardForm.capacity || !wardForm.floor) {
      toast.error("Ward name, type, capacity, and floor are required.");
      return false;
    }

    const capacity = Number(wardForm.capacity);
    const occupied = Number(wardForm.occupied || 0);

    if (capacity <= 0) {
      toast.error("Capacity must be greater than 0.");
      return false;
    }

    if (occupied > capacity) {
      toast.error("Occupied beds cannot be more than capacity.");
      return false;
    }

    return true;
  };

  const handleAddWard = async () => {
    if (!validateWardForm()) return;

    try {
      setSaving(true);

      const response = await axios.post(
        `${WARD_API}/createward`,
        {
          name: wardForm.name.trim(),
          type: wardForm.type.trim(),
          capacity: Number(wardForm.capacity),
          occupied: Number(wardForm.occupied || 0),
          floor: wardForm.floor.trim(),
          status: wardForm.status,
        },
        authConfig()
      );

      const createdWard = mapWard(response.data.data);

      setWards((prev) => [createdWard, ...prev]);
      setShowAddModal(false);
      resetForm();

      toast.success("Ward added successfully.");

      setTimeout(() => {
        router.push(`/wards/${createdWard.id}`);
      }, 500);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add ward.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWard = async () => {
    if (!editingWard) return;
    if (!validateWardForm()) return;

    try {
      setSaving(true);

      const response = await axios.put(
        `${WARD_API}/updateward/${editingWard.id}`,
        {
          name: wardForm.name.trim(),
          type: wardForm.type.trim(),
          capacity: Number(wardForm.capacity),
          occupied: Number(wardForm.occupied || 0),
          floor: wardForm.floor.trim(),
          status: wardForm.status,
        },
        authConfig()
      );

      const updatedWard = mapWard(response.data.data);

      setWards((prev) =>
        prev.map((ward) =>
          String(ward.id) === String(updatedWard.id) ? updatedWard : ward
        )
      );

      setShowEditModal(false);
      setEditingWard(null);
      resetForm();

      toast.success("Ward updated successfully.");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update ward.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWard = async (wardId) => {
    const confirmed = window.confirm("Are you sure you want to delete this ward?");

    if (!confirmed) return;

    try {
      await axios.delete(`${WARD_API}/deleteward/${wardId}`, authConfig());

      setWards((prev) => prev.filter((ward) => ward.id !== wardId));

      toast.success("Ward deleted successfully.");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete ward.";
      toast.error(message);
    }
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={container}>
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

              <button onClick={openAddModal} style={heroButton}>
                ＋ Add Ward
              </button>
            </div>
          </div>

          <div style={toolbar}>
            <div style={searchBox}>
              <span style={{ color: "#64748b", fontSize: 15 }}>🔍</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ward name, type, floor, or status..."
                style={searchInput}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={summaryPill}>
                <span style={summaryDot} />
                {filteredWards.length} wards showing
              </div>

              <button onClick={fetchWards} style={refreshBtn}>
                Refresh
              </button>
            </div>
          </div>

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

          {loading ? (
            <div style={emptyBox}>Loading wards...</div>
          ) : (
            <div style={wardGrid}>
              {filteredWards.map((ward) => (
                <WardCard
                  key={ward.id}
                  ward={ward}
                  onView={() => router.push(`/wards/${ward.id}`)}
                  onEdit={() => openEditModal(ward)}
                  onDelete={() => handleDeleteWard(ward.id)}
                />
              ))}
            </div>
          )}

          {!loading && filteredWards.length === 0 && (
            <div style={emptyBox}>No ward found.</div>
          )}

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

        {showAddModal && (
          <WardModal
            title="Add New Ward"
            subtitle="Create a new ward and add it to the management list."
            wardForm={wardForm}
            setWardForm={setWardForm}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddWard}
            submitText={saving ? "Saving..." : "Add New Ward"}
            saving={saving}
          />
        )}

        {showEditModal && (
          <WardModal
            title="Edit Ward"
            subtitle="Update ward details and capacity."
            wardForm={wardForm}
            setWardForm={setWardForm}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateWard}
            submitText={saving ? "Saving..." : "Save Changes"}
            saving={saving}
          />
        )}
      </main>
    </AppShell>
  );
}

function WardModal({
  title,
  subtitle,
  wardForm,
  setWardForm,
  onClose,
  onSubmit,
  submitText,
  saving,
}) {
  return (
    <div onClick={onClose} style={modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} style={modalBox}>
        <div style={modalHeader}>
          <div>
            <p style={sectionEyebrow}>WARD FORM</p>
            <h2 style={modalTitle}>{title}</h2>
            <p style={modalSubtitle}>{subtitle}</p>
          </div>

          <button onClick={onClose} style={closeBtn}>
            ×
          </button>
        </div>

        <Input
          label="Ward Name"
          placeholder="e.g. Surgical Ward C"
          value={wardForm.name}
          onChange={(v) => setWardForm({ ...wardForm, name: v })}
        />

        <Input
          label="Ward Type"
          placeholder="e.g. Surgical Care"
          value={wardForm.type}
          onChange={(v) => setWardForm({ ...wardForm, type: v })}
        />

        <Input
          label="Floor"
          placeholder="e.g. Floor 2"
          value={wardForm.floor}
          onChange={(v) => setWardForm({ ...wardForm, floor: v })}
        />

        <div style={modalGrid}>
          <Input
            label="Capacity"
            placeholder="40"
            type="number"
            value={wardForm.capacity}
            onChange={(v) => setWardForm({ ...wardForm, capacity: v })}
          />

          <Input
            label="Occupied Beds"
            placeholder="0"
            type="number"
            value={wardForm.occupied}
            onChange={(v) => setWardForm({ ...wardForm, occupied: v })}
          />
        </div>

        <label style={label}>
          Status
          <select
            value={wardForm.status}
            onChange={(e) =>
              setWardForm({ ...wardForm, status: e.target.value })
            }
            style={input}
          >
            <option>AVAILABLE</option>
            <option>NEAR CAPACITY</option>
            <option>FULL</option>
            <option>CRITICAL</option>
            <option>MAINTENANCE</option>
          </select>
        </label>

        <div style={modalActions}>
          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={saving}
            style={{
              ...primaryBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

function WardCard({ ward, onView, onEdit, onDelete }) {
  const usedPercent = ward.capacity
    ? Math.round((ward.occupied / ward.capacity) * 100)
    : 0;

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
          <div style={wardFloor}>📍 {ward.floor}</div>
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

const refreshBtn = {
  height: "42px",
  borderRadius: "999px",
  border: "none",
  background: "#0b4aa2",
  color: "#fff",
  padding: "0 14px",
  fontSize: "12px",
  fontWeight: "900",
  cursor: "pointer",
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

const wardFloor = {
  marginTop: "8px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: "800",
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