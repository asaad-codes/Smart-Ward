"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PATIENT_API = `${API_BASE_URL}/patient`;
const MEDICATION_API = `${API_BASE_URL}/medication`;
const VITAL_API = `${API_BASE_URL}/vital`; 

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

function getPatientIdFromRecord(record) {
  if (!record?.patient) return "";

  if (typeof record.patient === "object") {
    return String(record.patient._id || record.patient.id || "");
  }

  return String(record.patient);
}

function mapMedication(med) {
  return {
    id: med._id || med.id,
    name: med.name || "Unnamed Medication",
    dose: med.dose || "No dose",
    time: med.time || "--:--",
    location: med.location || "No location",
    status: med.status || "DUE NOW",
    tag: med.tag || "ROUTINE",
    completed: Boolean(med.completed),
  };
}

function mapVital(vital) {
  return {
    id: vital._id || vital.id,
    heartRate: vital.heartRate || 72,
    bp: vital.bp || "120/80",
    temp: vital.temp || 36.8,
    spo2: vital.spo2 || 98,
    status: vital.status || "STABLE",
    notes: vital.notes || "",
    recordedBy: vital.recordedBy?.name || "SmartWard Staff",
    createdAt: vital.createdAt
      ? new Date(vital.createdAt).toLocaleString()
      : "Just now",
  };
}

function mapPatient(patient, medications = [], vitals = []) {
  const id = patient._id || patient.id;
  const latestVital = vitals[0];

  return {
    id: String(id),
    name: patient.name || "Unnamed Patient",
    initials: getInitials(patient.name),
    age: patient.age || "",
    sex: formatGender(patient.gender),
    gender: patient.gender || "other",
    ward: patient.ward || "",
    bed: patient.bed || "",
    disease: patient.disease || "",
    status: patient.status || "STABLE",
    admission: patient.createdAt
      ? new Date(patient.createdAt).toLocaleDateString()
      : "Today",
    updatedAt: patient.updatedAt
      ? new Date(patient.updatedAt).toLocaleString()
      : "Just now",
    doctor: patient.admittedBy?.name || "SmartWard Staff",
    linkedUser: patient.user?._id || patient.user || "",
    vitals,
    latestVital: latestVital || {
      heartRate: 72,
      spo2: 98,
      bp: "120/80",
      temp: 36.8,
      status: "STABLE",
      notes: "",
      recordedBy: "SmartWard Staff",
      createdAt: "No live vital record",
    },
    medications,
    notes: [
      {
        id: "note-1",
        author: "SMARTWARD",
        time: "JUST NOW",
        text: patient.disease || "Patient admitted and record created.",
      },
    ],
  };
}

function statusColors(status) {
  const value = String(status || "").toUpperCase();

  if (value === "CRITICAL") {
    return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
  }

  if (value === "OBSERVATION") {
    return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
  }

  return { bg: "#dcfce7", text: "#047857", border: "#bbf7d0" };
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    disease: "",
    ward: "",
    bed: "",
    gender: "male",
    status: "STABLE",
  });

  const canAccess = role === "admin" || role === "doctor" || role === "patient";
  const canEdit = role === "admin" || role === "doctor";

  const fetchPatient = async () => {
    try {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      setRole(storedUser.role);
      setLoading(true);

      if (storedUser.role === "patient") {
        const [patientRes, medRes, vitalRes] = await Promise.all([
          axios.get(`${PATIENT_API}/me`, authConfig()),
          axios.get(`${MEDICATION_API}/mymedications`, authConfig()),
          axios.get(`${VITAL_API}/myvitals`, authConfig()),
        ]);

        const myPatient = patientRes.data?.data;

        if (!myPatient) {
          toast.error("Patient record not found.");
          router.push("/dashboard");
          return;
        }

        const myPatientId = String(myPatient._id || myPatient.id);

        if (myPatientId !== String(params.id)) {
          toast.error("You can only view your own patient record.");
          router.push("/patients");
          return;
        }

        const medications = Array.isArray(medRes.data?.data)
          ? medRes.data.data.map(mapMedication)
          : [];

        const vitals = Array.isArray(vitalRes.data?.data)
          ? vitalRes.data.data.map(mapVital)
          : [];

        setPatient(mapPatient(myPatient, medications, vitals));
        return;
      }

      if (storedUser.role !== "admin" && storedUser.role !== "doctor") {
        toast.error("You are not allowed to view patient details.");
        router.push("/dashboard");
        return;
      }

      const [patientRes, medicationRes, vitalRes] = await Promise.all([
        axios.get(`${PATIENT_API}/getpatients`, authConfig()),
        axios.get(`${MEDICATION_API}/getmedications`, authConfig()),
        axios.get(`${VITAL_API}/getvitals`, authConfig()),
      ]);

      const allPatients = Array.isArray(patientRes.data?.data)
        ? patientRes.data.data
        : [];

      const selectedPatient = allPatients.find(
        (item) => String(item._id || item.id) === String(params.id)
      );

      if (!selectedPatient) {
        toast.error("Patient not found.");
        router.push("/patients");
        return;
      }

      const allMedications = Array.isArray(medicationRes.data?.data)
        ? medicationRes.data.data
        : [];

      const allVitals = Array.isArray(vitalRes.data?.data)
        ? vitalRes.data.data
        : [];

      const selectedMedications = allMedications
        .filter((med) => getPatientIdFromRecord(med) === String(params.id))
        .map(mapMedication);

      const selectedVitals = allVitals
        .filter((vital) => getPatientIdFromRecord(vital) === String(params.id))
        .map(mapVital);

      setPatient(
        mapPatient(selectedPatient, selectedMedications, selectedVitals)
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load patient details.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [params.id]);

  const patientStatus = statusColors(patient?.status);

  const pulseStatusText = useMemo(() => {
    const pulse = Number(patient?.latestVital?.heartRate || 72);

    if (pulse >= 110) return "HIGH RANGE";
    if (pulse <= 55) return "LOW RANGE";
    return "NORMAL RANGE";
  }, [patient?.latestVital?.heartRate]);

  const openEditModal = () => {
    if (!patient) return;

    setEditForm({
      name: patient.name,
      age: patient.age,
      disease: patient.disease,
      ward: patient.ward,
      bed: patient.bed,
      gender: patient.gender,
      status: patient.status,
    });

    setShowEditModal(true);
  };

  const saveEditChart = async () => {
    if (!canEdit) {
      toast.error("You are not allowed to edit patient records.");
      return;
    }

    if (
      !editForm.name ||
      !editForm.age ||
      !editForm.disease ||
      !editForm.ward ||
      !editForm.bed ||
      !editForm.gender
    ) {
      toast.error("Please fill all required patient fields.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${PATIENT_API}/updatepatient/${patient.id}`,
        {
          name: editForm.name.trim(),
          age: Number(editForm.age),
          disease: editForm.disease.trim(),
          ward: editForm.ward.trim(),
          bed: editForm.bed.trim(),
          gender: editForm.gender,
          status: editForm.status,
        },
        authConfig()
      );

      setShowEditModal(false);
      toast.success("Patient chart updated.");
      fetchPatient();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update patient.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!canEdit) {
      toast.error("You are not allowed to delete patient records.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${PATIENT_API}/deletepatient/${patient.id}`,
        authConfig()
      );

      toast.success("Patient deleted successfully.");
      router.push("/patients");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete patient.";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={loadingPage}>Loading patient profile...</div>
      </AppShell>
    );
  }

  if (!canAccess) {
    return (
      <AppShell>
        <div style={loadingPage}>Access denied.</div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div style={loadingPage}>Patient not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={pageWrap}>
        <div style={topBar}>
          <div style={topLeft}>
            <button onClick={() => router.push("/patients")} style={backButton}>
              ←
            </button>

            <h1 style={headerTitle}>
              {role === "patient" ? "My Patient Detail" : "Patient Detail"}
            </h1>
          </div>

          <div style={topRight}>
            <button
              onClick={() => router.push(`/reports?patientId=${patient.id}`)}
              style={reportBtn}
            >
              📄 Report
            </button>

            {canEdit && (
              <>
                <button onClick={openEditModal} style={primaryBtn}>
                  ✎ Edit Chart
                </button>

                <button onClick={handleDeletePatient} style={dangerBtn}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div style={contentGrid}>
          <section style={profileCard}>
            <div style={avatarCard}>{patient.initials}</div>

            <div>
              <div style={profileTop}>
                <div>
                  <h2 style={patientName}>{patient.name}</h2>

                  <p style={patientMeta}>
                    {patient.sex}, {patient.age} years • ID: #{patient.id}
                  </p>
                </div>

                <span
                  style={{
                    ...statusBadge,
                    background: patientStatus.bg,
                    color: patientStatus.text,
                    border: `1px solid ${patientStatus.border}`,
                  }}
                >
                  {patient.status}
                </span>
              </div>

              <div style={infoGrid}>
                <InfoItem label="WARD" value={patient.ward || "N/A"} />
                <InfoItem label="BED" value={patient.bed || "N/A"} />
                <InfoItem label="DISEASE" value={patient.disease || "N/A"} />
                <InfoItem label="ADMISSION" value={patient.admission} />
                <InfoItem label="ADMITTED BY" value={patient.doctor} />
                <InfoItem label="UPDATED" value={patient.updatedAt} />
              </div>
            </div>
          </section>

          <section style={statsGrid}>
            <InfoBox title="Blood Pressure" value={patient.latestVital.bp} />
            <InfoBox title="SpO2" value={`${patient.latestVital.spo2}%`} />
            <InfoBox
              title="Pulse"
              value={`${patient.latestVital.heartRate} BPM`}
            />
            <InfoBox title="Temperature" value={`${patient.latestVital.temp}°C`} />
          </section>

          <section style={twoColumn}>
            <div style={card}>
              <h3 style={cardTitle}>Medication Schedule</h3>

              {patient.medications.length > 0 ? (
                patient.medications.map((med) => (
                  <div key={med.id} style={medRow}>
                    <div>
                      <b>{med.name}</b>
                      <div style={muted}>
                        {med.dose} • {med.location}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <b>{med.time}</b>
                      <div style={muted}>{med.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={muted}>No medication assigned to this patient.</p>
              )}
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Latest Vitals</h3>

              {patient.vitals.length > 0 ? (
                patient.vitals.slice(0, 4).map((vital) => (
                  <div key={vital.id} style={noteCard}>
                    <div style={muted}>
                      {vital.createdAt} • {vital.recordedBy}
                    </div>

                    <p style={{ marginBottom: 0, fontWeight: 800 }}>
                      BP {vital.bp} • HR {vital.heartRate} • SpO2 {vital.spo2}% •{" "}
                      {vital.status}
                    </p>

                    {vital.notes && <p style={{ marginBottom: 0 }}>{vital.notes}</p>}
                  </div>
                ))
              ) : (
                <p style={muted}>No vital records added for this patient.</p>
              )}
            </div>
          </section>

          <section style={alertCard}>
            <h3 style={{ marginTop: 0 }}>Real-time Pulse</h3>

            <div style={pulseValue}>{patient.latestVital.heartRate}</div>

            <p style={{ marginBottom: 0 }}>
              Beats per minute • Status: {pulseStatusText}
            </p>
          </section>
        </div>

        {showEditModal && (
          <Modal title="Edit Patient Chart" onClose={() => setShowEditModal(false)}>
            <div style={modalGrid}>
              <InputField
                label="Name"
                value={editForm.name}
                onChange={(value) => setEditForm({ ...editForm, name: value })}
              />

              <InputField
                label="Age"
                value={editForm.age}
                onChange={(value) => setEditForm({ ...editForm, age: value })}
              />

              <InputField
                label="Disease"
                value={editForm.disease}
                onChange={(value) =>
                  setEditForm({ ...editForm, disease: value })
                }
              />

              <InputField
                label="Ward"
                value={editForm.ward}
                onChange={(value) => setEditForm({ ...editForm, ward: value })}
              />

              <InputField
                label="Bed"
                value={editForm.bed}
                onChange={(value) => setEditForm({ ...editForm, bed: value })}
              />

              <SelectField
                label="Gender"
                value={editForm.gender}
                onChange={(value) =>
                  setEditForm({ ...editForm, gender: value })
                }
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
              />

              <SelectField
                label="Status"
                value={editForm.status}
                onChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
                options={[
                  { label: "STABLE", value: "STABLE" },
                  { label: "OBSERVATION", value: "OBSERVATION" },
                  { label: "CRITICAL", value: "CRITICAL" },
                ]}
              />
            </div>

            <div style={modalActions}>
              <button onClick={() => setShowEditModal(false)} style={cancelBtn}>
                Cancel
              </button>

              <button
                onClick={saveEditChart}
                disabled={saving}
                style={{
                  ...saveBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

function InfoBox({ title, value }) {
  return (
    <div style={card}>
      <div style={muted}>{title}</div>
      <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px" }}>
        {value}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <label>
      <div style={fieldLabel}>{label}</div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={fieldInput}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label>
      <div style={fieldLabel}>{label}</div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={fieldInput}
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

const loadingPage = {
  minHeight: "100vh",
  background: "#f5f8fc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 800,
};

const pageWrap = {
  minHeight: "100vh",
  background: "#f5f8fc",
  color: "#111827",
  fontFamily: "Inter, Arial, sans-serif",
};

const topBar = {
  minHeight: 72,
  borderBottom: "1px solid #e7edf5",
  background: "#f8fbff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "0 28px",
};

const topLeft = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const topRight = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const backButton = {
  border: "none",
  background: "transparent",
  fontSize: 28,
  cursor: "pointer",
  color: "#111827",
};

const headerTitle = {
  margin: 0,
  color: "#0b4aa2",
  fontWeight: 800,
  fontSize: 22,
};

const contentGrid = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 22,
};

const profileCard = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 20,
  padding: 24,
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: 24,
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const avatarCard = {
  width: 120,
  height: 120,
  borderRadius: 18,
  background: "linear-gradient(135deg,#111827,#334155,#0f766e)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 44,
  fontWeight: 900,
};

const profileTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 16,
};

const patientName = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.1,
  fontWeight: 900,
};

const patientMeta = {
  margin: "8px 0 0",
  fontSize: 16,
  color: "#64748b",
};

const statusBadge = {
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 800,
};

const infoGrid = {
  marginTop: 20,
  paddingTop: 16,
  borderTop: "1px solid #edf2f7",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.5,
  marginBottom: 6,
};

const infoValue = {
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 18,
};

const twoColumn = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};

const card = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const cardTitle = {
  marginTop: 0,
  fontSize: 18,
  fontWeight: 900,
};

const muted = {
  color: "#64748b",
  fontSize: 13,
};

const medRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #edf2f7",
  padding: "14px 0",
};

const noteCard = {
  background: "#f2f6fb",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
};

const alertCard = {
  background: "#0a53b2",
  borderRadius: 20,
  padding: 24,
  color: "#fff",
};

const pulseValue = {
  fontSize: 72,
  lineHeight: 1,
  fontWeight: 900,
};

const reportBtn = {
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "#0f766e",
  color: "#fff",
  padding: "0 20px",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryBtn = {
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "#0b4aa2",
  color: "#fff",
  padding: "0 20px",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerBtn = {
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "0 20px",
  fontWeight: 800,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  zIndex: 9999,
  display: "grid",
  placeItems: "center",
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxWidth: 620,
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 25px 60px rgba(15,23,42,.22)",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 22,
};

const fieldLabel = {
  fontSize: "12px",
  fontWeight: 800,
  color: "#64748b",
  marginBottom: "7px",
};

const fieldInput = {
  width: "100%",
  height: "46px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  outline: "none",
  boxSizing: "border-box",
};

const cancelBtn = {
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ed",
  background: "#fff",
  color: "#334155",
  padding: "0 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const saveBtn = {
  height: 44,
  borderRadius: 12,
  border: "none",
  background: "#064aa2",
  color: "#fff",
  padding: "0 22px",
  fontWeight: 800,
}; 