"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return words[0]?.slice(0, 2).toUpperCase() || "PT";
}

function formatGender(gender = "") {
  const value = String(gender).toLowerCase();

  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "Other";
}

function mapPatient(patient) {
  const id = patient._id || patient.id;

  return {
    id: String(id),
    name: patient.name || "Unnamed Patient",
    initials: getInitials(patient.name),
    pid: `SW-${String(id).slice(-6).toUpperCase()}`,
    age: patient.age || "--",
    gender: patient.gender || "other",
    sex: formatGender(patient.gender),
    ward: patient.ward || "Unassigned",
    bed: patient.bed || "--",
    disease: patient.disease || "No condition added",
    status: patient.status || "STABLE",
    linkedUser: patient.user?._id || patient.user || "",
    admittedBy: patient.admittedBy?.name || "SmartWard Staff",
    createdAt: patient.createdAt
      ? new Date(patient.createdAt).toLocaleDateString()
      : "Today",
    updatedAt: patient.updatedAt
      ? new Date(patient.updatedAt).toLocaleString()
      : "Just now",
  };
}

function getStatusStyles(status) {
  const value = String(status).toUpperCase();

  if (value === "CRITICAL") {
    return {
      bg: "#fee2e2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  }

  if (value === "OBSERVATION") {
    return {
      bg: "#dbeafe",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  }

  return {
    bg: "#dcfce7",
    color: "#047857",
    border: "#bbf7d0",
  };
}

export default function PatientsPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    disease: "",
    ward: "",
    bed: "",
    gender: "male",
    status: "STABLE",
    user: "",
  });

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  const canViewPatients = isAdmin || isDoctor || isPatient;

  const fetchPatients = async () => {
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
        const response = await axios.get(`${PATIENT_API}/me`, authConfig());

        const patient = response.data?.data ? mapPatient(response.data.data) : null;

        setPatients(patient ? [patient] : []);
        return;
      }

      if (currentRole !== "admin" && currentRole !== "doctor") {
        toast.error("You are not allowed to access patients.");
        router.push("/dashboard");
        return;
      }

      const response = await axios.get(`${PATIENT_API}/getpatients`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapPatient)
        : [];

      setPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesSearch =
        !q ||
        patient.name.toLowerCase().includes(q) ||
        patient.pid.toLowerCase().includes(q) ||
        patient.ward.toLowerCase().includes(q) ||
        patient.bed.toLowerCase().includes(q) ||
        patient.disease.toLowerCase().includes(q) ||
        patient.status.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All Statuses"
          ? true
          : patient.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const criticalCount = patients.filter(
    (patient) => patient.status === "CRITICAL"
  ).length;

  const observationCount = patients.filter(
    (patient) => patient.status === "OBSERVATION"
  ).length;

  const stableCount = patients.filter(
    (patient) => patient.status === "STABLE"
  ).length;

  const handleAdmitPatient = async () => {
    if (!isAdmin) {
      toast.error("Only admin can admit patients.");
      return;
    }

    if (
      !newPatient.name ||
      !newPatient.age ||
      !newPatient.disease ||
      !newPatient.ward ||
      !newPatient.bed ||
      !newPatient.gender
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: newPatient.name.trim(),
        age: Number(newPatient.age),
        disease: newPatient.disease.trim(),
        ward: newPatient.ward.trim(),
        bed: newPatient.bed.trim(),
        gender: newPatient.gender,
        status: newPatient.status,
      };

      if (newPatient.user.trim()) {
        payload.user = newPatient.user.trim();
      }

      const response = await axios.post(
        `${PATIENT_API}/createpatient`,
        payload,
        authConfig()
      );

      const createdPatient = mapPatient(response.data.data);

      setPatients((prev) => [createdPatient, ...prev]);

      setNewPatient({
        name: "",
        age: "",
        disease: "",
        ward: "",
        bed: "",
        gender: "male",
        status: "STABLE",
        user: "",
      });

      setShowAdmitModal(false);
      toast.success("Patient admitted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to admit patient.");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewPatients && !loading) {
    return (
      <AppShell>
        <main style={page}>
          <div style={emptyBox}>You are not allowed to view patients.</div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>
              {isPatient ? "MY LINKED RECORD" : "SMARTWARD PATIENT DIRECTORY"}
            </div>

            <h1 style={heroTitle}>
              {isPatient ? "My Patient Record" : "Patients"}
            </h1>

            <p style={heroSubtitle}>
              {isAdmin
                ? "Admin can admit, view, and manage patient records linked with SmartWard data."
                : isDoctor
                ? "Doctor can view and review patient records, medications, vitals, and reports."
                : "Patient can view only their own linked record and open their personal detail page."}
            </p>
          </div>

          <div style={heroActions}>
            <div style={roleBox}>
              <span style={roleLabel}>Access Role</span>
              <strong style={roleValue}>{role || "Loading..."}</strong>
            </div>

            {isAdmin && (
              <button onClick={() => setShowAdmitModal(true)} style={admitButton}>
                + Admit Patient
              </button>
            )}
          </div>
        </section>

        <section style={statsGrid}>
          <StatCard label={isPatient ? "MY RECORD" : "TOTAL PATIENTS"} value={patients.length} color="#064aa2" />
          <StatCard label="CRITICAL" value={criticalCount} color="#cf171d" />
          <StatCard label="OBSERVATION" value={observationCount} color="#1d4ed8" />
          <StatCard label="STABLE" value={stableCount} color="#047857" />
        </section>

        <section style={directoryCard}>
          <div style={toolbar}>
            <div>
              <h2 style={sectionTitle}>
                {isPatient ? "Personal Patient Record" : "Active Patient Records"}
              </h2>
              <p style={sectionSubtitle}>
                Click any record to open the full patient detail page.
              </p>
            </div>

            <div style={toolbarActions}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ward, bed, disease..."
                style={searchInput}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={filterSelect}
              >
                <option>All Statuses</option>
                <option>CRITICAL</option>
                <option>OBSERVATION</option>
                <option>STABLE</option>
              </select>

              <button onClick={fetchPatients} style={refreshBtn}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div style={emptyBox}>Loading patient records...</div>
          ) : filteredPatients.length === 0 ? (
            <div style={emptyBox}>No patient records found.</div>
          ) : (
            <div style={patientGrid}>
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => router.push(`/patients/${patient.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {showAdmitModal && isAdmin && (
          <Modal title="Admit New Patient" onClose={() => setShowAdmitModal(false)}>
            <div style={modalGrid}>
              <Input
                label="Full Name"
                value={newPatient.name}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, name: value })
                }
                placeholder="e.g. Musab Ali"
              />

              <Input
                label="Age"
                value={newPatient.age}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, age: value })
                }
                placeholder="e.g. 24"
              />

              <Input
                label="Disease / Condition"
                value={newPatient.disease}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, disease: value })
                }
                placeholder="e.g. Fever"
              />

              <Input
                label="Ward"
                value={newPatient.ward}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, ward: value })
                }
                placeholder="e.g. Ward A"
              />

              <Input
                label="Bed"
                value={newPatient.bed}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, bed: value })
                }
                placeholder="e.g. 12"
              />

              <Select
                label="Gender"
                value={newPatient.gender}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, gender: value })
                }
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
              />

              <Select
                label="Status"
                value={newPatient.status}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, status: value })
                }
                options={[
                  { label: "STABLE", value: "STABLE" },
                  { label: "OBSERVATION", value: "OBSERVATION" },
                  { label: "CRITICAL", value: "CRITICAL" },
                ]}
              />

              <Input
                label="Patient User ID Optional"
                value={newPatient.user}
                onChange={(value) =>
                  setNewPatient({ ...newPatient, user: value })
                }
                placeholder="Paste login user _id for patient account"
              />
            </div>

            <div style={modalActions}>
              <button onClick={() => setShowAdmitModal(false)} style={cancelBtn}>
                Cancel
              </button>

              <button
                onClick={handleAdmitPatient}
                disabled={saving}
                style={{
                  ...saveBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Admit Patient"}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </AppShell>
  );
}

function PatientCard({ patient, onClick }) {
  const badge = getStatusStyles(patient.status);

  return (
    <article onClick={onClick} style={patientCard}>
      <div style={cardTop}>
        <div style={avatar}>{patient.initials}</div>

        <div style={{ flex: 1 }}>
          <h3 style={patientName}>{patient.name}</h3>
          <p style={patientId}>PID: {patient.pid}</p>
        </div>

        <span
          style={{
            ...statusBadge,
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {patient.status}
        </span>
      </div>

      <div style={patientInfoGrid}>
        <InfoItem label="Age / Sex" value={`${patient.age} yrs • ${patient.sex}`} />
        <InfoItem label="Ward / Bed" value={`${patient.ward} • Bed ${patient.bed}`} />
        <InfoItem label="Condition" value={patient.disease} />
        <InfoItem label="Admitted By" value={patient.admittedBy} />
      </div>

      <div style={cardFooter}>
        <span>Updated: {patient.updatedAt}</span>
        <strong>Open Detail →</strong>
      </div>
    </article>
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

function InfoItem({ label, value }) {
  return (
    <div style={infoItem}>
      <span style={infoLabel}>{label}</span>
      <strong style={infoValue}>{value}</strong>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} style={modalBox}>
        <h2 style={modalTitle}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Input({ label: inputLabel, value, onChange, placeholder }) {
  return (
    <label style={label}>
      {inputLabel}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
    </label>
  );
}

function Select({ label: inputLabel, value, onChange, options }) {
  return (
    <label style={label}>
      {inputLabel}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

const admitButton = {
  border: "none",
  background: "#ffffff",
  color: "#0b4aa2",
  borderRadius: "999px",
  minHeight: "48px",
  padding: "0 22px",
  fontWeight: "900",
  cursor: "pointer",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "22px",
};

const statCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontWeight: "900",
  fontSize: "13px",
  letterSpacing: "2px",
};

const statValue = {
  margin: "12px 0 0",
  fontSize: "34px",
  fontWeight: "900",
};

const directoryCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  padding: "22px",
};

const toolbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  marginBottom: "20px",
};

const sectionTitle = {
  margin: 0,
  color: "#0b4aa2",
  fontSize: "22px",
  fontWeight: "900",
};

const sectionSubtitle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "600",
};

const toolbarActions = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const searchInput = {
  height: "46px",
  width: "280px",
  borderRadius: "999px",
  border: "1px solid #dbe3ed",
  background: "#f8fafc",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
};

const filterSelect = {
  height: "46px",
  borderRadius: "14px",
  border: "1px solid #dbe3ed",
  background: "#f8fafc",
  padding: "0 14px",
  fontWeight: "800",
  outline: "none",
};

const refreshBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: "999px",
  height: "46px",
  padding: "0 20px",
  fontWeight: "900",
  cursor: "pointer",
};

const patientGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "18px",
};

const patientCard = {
  background: "#ffffff",
  border: "1px solid #e9eef5",
  borderRadius: "22px",
  padding: "22px",
  cursor: "pointer",
  boxShadow: "0 10px 26px rgba(15,23,42,.05)",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "18px",
};

const avatar = {
  width: "54px",
  height: "54px",
  borderRadius: "16px",
  background: "linear-gradient(135deg,#0b4aa2,#0f766e)",
  display: "grid",
  placeItems: "center",
  color: "#fff",
  fontSize: "18px",
  fontWeight: "900",
};

const patientName = {
  margin: 0,
  color: "#0f172a",
  fontSize: "21px",
  fontWeight: "900",
};

const patientId = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
};

const statusBadge = {
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "900",
};

const patientInfoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  background: "#f8fafc",
  borderRadius: "16px",
  padding: "14px",
};

const infoItem = {
  minWidth: 0,
};

const infoLabel = {
  display: "block",
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  marginBottom: "5px",
};

const infoValue = {
  display: "block",
  color: "#0f172a",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const cardFooter = {
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid #edf2f7",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  color: "#64748b",
  fontSize: "13px",
};

const emptyBox = {
  background: "#f8fafc",
  borderRadius: "18px",
  padding: "28px",
  color: "#64748b",
  fontWeight: "900",
  border: "1px solid #e9eef5",
  textAlign: "center",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 9999,
};

const modalBox = {
  width: "100%",
  maxWidth: 680,
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 25px 70px rgba(15,23,42,.25)",
};

const modalTitle = {
  margin: "0 0 18px",
  fontSize: 28,
  color: "#0f172a",
  fontWeight: "900",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const label = {
  display: "block",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 14,
};

const input = {
  marginTop: 8,
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  boxSizing: "border-box",
  outline: "none",
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
  borderRadius: 999,
  minHeight: 46,
  padding: "0 20px",
  fontWeight: 900,
  cursor: "pointer",
};

const saveBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  minHeight: 46,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
}; 