"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const MEDICATION_API = `${API_BASE_URL}/medication`;
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

function mapMedication(med) {
  const patientObj =
    med.patient && typeof med.patient === "object" ? med.patient : null;

  return {
    id: med._id || med.id,
    time: med.time || "12:00",
    name: med.name || "Unnamed Medication",
    dose: med.dose || "No dose",

    patientId: patientObj?._id || med.patient || "",
    patientName:
      patientObj?.name ||
      (typeof med.patient === "string" ? med.patient : "Unknown Patient"),
    patientWard: patientObj?.ward || "",
    patientBed: patientObj?.bed || "",
    patientDisease: patientObj?.disease || "",

    location: med.location || "No location",
    tag: med.tag || "ROUTINE",
    status: med.status || "DUE NOW",
    section: med.section || "noon",
    completed: Boolean(med.completed),
    actionReason: med.actionReason || "",
  };
}

function mapPatient(patient) {
  return {
    id: String(patient._id || patient.id),
    name: patient.name || "Unnamed Patient",
    age: patient.age || "",
    disease: patient.disease || "",
    ward: patient.ward || "",
    bed: patient.bed || "",
    gender: patient.gender || "",
    status: patient.status || "STABLE",
  };
}

export default function MedicationsPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);

  const [selectedMedication, setSelectedMedication] = useState(null);
  const [missedReason, setMissedReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    dose: "",
    patient: "",
    location: "",
    time: "12:00",
    tag: "ROUTINE",
  });

  const isPatient = role === "patient";
  const canManage = role === "admin" || role === "doctor" || role === "nurse";
  const canSelectPatients = role === "admin" || role === "doctor";

  const fetchPatientsForDropdown = async (currentRole) => {
    if (currentRole !== "admin" && currentRole !== "doctor") return;

    try {
      const response = await axios.get(`${PATIENT_API}/getpatients`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapPatient)
        : [];

      setPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patients.");
    }
  };

  const fetchMedications = async () => {
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
        const response = await axios.get(
          `${MEDICATION_API}/mymedications`,
          authConfig()
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data.map(mapMedication)
          : [];

        setMedications(data);
        return;
      }

      if (
        currentRole !== "admin" &&
        currentRole !== "doctor" &&
        currentRole !== "nurse"
      ) {
        toast.error("You are not allowed to access medications.");
        router.push("/dashboard");
        return;
      }

      const response = await axios.get(
        `${MEDICATION_API}/getmedications`,
        authConfig()
      );

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapMedication)
        : [];

      setMedications(data);
      await fetchPatientsForDropdown(currentRole);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch medications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handlePatientChange = (patientId) => {
    const selectedPatient = patients.find((patient) => patient.id === patientId);

    setForm((prev) => ({
      ...prev,
      patient: patientId,
      location: selectedPatient
        ? `${selectedPatient.ward || "Ward"} • Bed ${selectedPatient.bed || "--"}`
        : prev.location,
    }));
  };

  const addMedication = async () => {
    if (!canManage) {
      toast.error("You are not allowed to add medication.");
      return;
    }

    if (!form.name || !form.dose || !form.patient || !form.location) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${MEDICATION_API}/createmedication`,
        {
          name: form.name.trim(),
          dose: form.dose.trim(),
          patient: form.patient.trim(),
          location: form.location.trim(),
          time: form.time,
          tag: form.tag,
        },
        authConfig()
      );

      const newMedication = mapMedication(response.data.data);

      setMedications((prev) => [newMedication, ...prev]);

      setForm({
        name: "",
        dose: "",
        patient: "",
        location: "",
        time: "12:00",
        tag: "ROUTINE",
      });

      setShowAddModal(false);
      toast.success("Medication added successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add medication.");
    } finally {
      setSaving(false);
    }
  };

  const markAsGiven = async (id) => {
    if (!canManage) {
      toast.error("You are not allowed to update medication.");
      return;
    }

    try {
      const response = await axios.put(
        `${MEDICATION_API}/markgiven/${id}`,
        {},
        authConfig()
      );

      const updatedMedication = mapMedication(response.data.data);

      setMedications((prev) =>
        prev.map((med) => (med.id === id ? updatedMedication : med))
      );

      toast.success("Medication marked as given.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as given.");
    }
  };

  const openMissedModal = (medication) => {
    if (!canManage) {
      toast.error("You are not allowed to update medication.");
      return;
    }

    setSelectedMedication(medication);
    setMissedReason("");
    setShowMissedModal(true);
  };

  const markAsMissed = async () => {
    if (!selectedMedication) {
      toast.error("Medication not selected.");
      return;
    }

    if (!missedReason.trim()) {
      toast.error("Please enter missed reason.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.put(
        `${MEDICATION_API}/markmissed/${selectedMedication.id}`,
        {
          actionReason: missedReason.trim(),
        },
        authConfig()
      );

      const updatedMedication = mapMedication(response.data.data);

      setMedications((prev) =>
        prev.map((med) =>
          med.id === selectedMedication.id ? updatedMedication : med
        )
      );

      setShowMissedModal(false);
      setSelectedMedication(null);
      setMissedReason("");

      toast.success("Missed medication recorded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as missed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMedication = async (id) => {
    if (!canManage) {
      toast.error("You are not allowed to delete medication.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medication?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${MEDICATION_API}/deletemedication/${id}`, authConfig());

      setMedications((prev) => prev.filter((med) => med.id !== id));

      toast.success("Medication deleted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete medication."
      );
    }
  };

  const total = medications.length;
  const completed = medications.filter((med) => med.completed).length;
  const missed = medications.filter((med) => med.status === "MISSED").length;
  const scheduled = medications.filter(
    (med) => med.status === "SCHEDULED"
  ).length;

  const morningMeds = medications.filter((med) => med.section === "morning");
  const noonMeds = medications.filter((med) => med.section === "noon");
  const eveningMeds = medications.filter((med) => med.section === "evening");

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>
              {isPatient ? "MY MEDICATION RECORDS" : "SMARTWARD MEDICATION CONTROL"}
            </div>

            <h1 style={heroTitle}>
              {isPatient ? "My Medication Schedule" : "Medication Schedule"}
            </h1>

            <p style={heroSubtitle}>
              {isPatient
                ? "View medications assigned to your linked patient record, including dosage, timing, status, and care location."
                : "Manage medication rounds, track administered and missed doses, and monitor patient medication status from SmartWard records."}
            </p>
          </div>

          <div style={heroActions}>
            <div style={roleBox}>
              <span style={roleLabel}>Access Role</span>
              <strong style={roleValue}>{role || "Loading..."}</strong>
            </div>

            <button onClick={fetchMedications} style={heroSecondaryBtn}>
              Refresh
            </button>

            {canManage && (
              <button onClick={() => setShowAddModal(true)} style={heroPrimaryBtn}>
                + Add Medication
              </button>
            )}
          </div>
        </section>

        <section style={container}>
          <div style={statsGrid}>
            <StatCard label="TOTAL DUE TODAY" value={total} color="#064aa2" />
            <StatCard label="COMPLETED" value={completed} color="#047857" />
            <StatCard label="MISSED/LATE" value={missed} color="#cf171d" />
            <StatCard label="SCHEDULED" value={scheduled} color="#7c3aed" />
          </div>

          {loading ? (
            <div style={emptyBox}>Loading medications...</div>
          ) : (
            <>
              <MedicationSection
                title="08:00 Morning Rounds"
                meds={morningMeds}
                emptyText="No morning medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />

              <MedicationSection
                title="12:00 Noon Rounds"
                meds={noonMeds}
                emptyText="No noon medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />

              <MedicationSection
                title="18:00 Evening Rounds"
                meds={eveningMeds}
                emptyText="No evening medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />
            </>
          )}
        </section>

        {showAddModal && canManage && (
          <Modal title="Add Medication" onClose={() => setShowAddModal(false)}>
            <Input
              label="Medication Name"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="e.g. Paracetamol"
            />

            <Input
              label="Dose"
              value={form.dose}
              onChange={(value) => setForm({ ...form, dose: value })}
              placeholder="e.g. 500mg Tablet"
            />

            {canSelectPatients ? (
              <label style={label}>
                Select Patient
                <select
                  value={form.patient}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  style={input}
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — {patient.ward} / Bed {patient.bed}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Input
                label="Patient Record ID"
                value={form.patient}
                onChange={(value) => setForm({ ...form, patient: value })}
                placeholder="Paste patient record ID"
              />
            )}

            <Input
              label="Location"
              value={form.location}
              onChange={(value) => setForm({ ...form, location: value })}
              placeholder="e.g. ICU 12 • Bed A"
            />

            <label style={label}>
              Time
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={input}
              >
                <option value="08:00">08:00</option>
                <option value="12:00">12:00</option>
                <option value="18:00">18:00</option>
              </select>
            </label>

            <label style={label}>
              Type
              <select
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                style={input}
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="STAT ORDER">STAT ORDER</option>
                <option value="PRN">PRN</option>
              </select>
            </label>

            <div style={modalActions}>
              <button onClick={() => setShowAddModal(false)} style={cancelBtn}>
                Cancel
              </button>

              <button
                onClick={addMedication}
                disabled={saving}
                style={{
                  ...primaryBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Adding..." : "Add Medication"}
              </button>
            </div>
          </Modal>
        )}

        {showMissedModal && (
          <Modal
            title="Missed Medication Action"
            onClose={() => setShowMissedModal(false)}
          >
            <p style={modalText}>
              Medication: <strong>{selectedMedication?.name}</strong>
              <br />
              Patient: <strong>{selectedMedication?.patientName}</strong>
            </p>

            <textarea
              value={missedReason}
              onChange={(e) => setMissedReason(e.target.value)}
              placeholder="Enter reason e.g. patient refused, unavailable, delayed..."
              style={textarea}
            />

            <div style={modalActions}>
              <button
                onClick={() => setShowMissedModal(false)}
                style={cancelBtn}
              >
                Cancel
              </button>

              <button
                onClick={markAsMissed}
                disabled={saving}
                style={{
                  ...primaryBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Submit Action"}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </AppShell>
  );
}

function MedicationSection({
  title,
  meds,
  emptyText,
  onGiven,
  onMissed,
  onDelete,
  canManage,
}) {
  return (
    <div style={section}>
      <div style={sectionHeader}>
        <h2 style={sectionTitle}>{title}</h2>
        <span style={sectionCount}>{meds.length} records</span>
      </div>

      {meds.length === 0 ? (
        <div style={emptyBox}>{emptyText}</div>
      ) : (
        <div style={grid}>
          {meds.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              onGiven={() => onGiven(med.id)}
              onMissed={() => onMissed(med)}
              onDelete={() => onDelete(med.id)}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationCard({ med, onGiven, onMissed, onDelete, canManage }) {
  const statusStyle =
    med.status === "ADMINISTERED"
      ? givenBadge
      : med.status === "MISSED"
      ? missedBadge
      : med.status === "SCHEDULED"
      ? scheduledBadge
      : dueBadge;

  return (
    <div style={card}>
      <div style={cardTop}>
        <div style={pillIcon}>💊</div>

        <div>
          <h3 style={medName}>{med.name}</h3>
          <p style={medDose}>{med.dose}</p>
        </div>

        <span style={statusStyle}>{med.status}</span>
      </div>

      <div style={infoBox}>
        <p style={infoLine}>
          <strong>Patient:</strong> {med.patientName}
        </p>

        {med.patientWard || med.patientBed ? (
          <p style={infoLine}>
            <strong>Ward / Bed:</strong> {med.patientWard || "N/A"} /{" "}
            {med.patientBed || "N/A"}
          </p>
        ) : null}

        <p style={infoLine}>
          <strong>Location:</strong> {med.location}
        </p>

        <p style={infoLine}>
          <strong>Time:</strong> {med.time}
        </p>

        <p style={infoLine}>
          <strong>Type:</strong> {med.tag}
        </p>
      </div>

      {med.actionReason && (
        <div style={reasonBox}>
          <strong>Missed Reason:</strong> {med.actionReason}
        </div>
      )}

      {canManage && (
        <div style={buttonRow}>
          <button
            onClick={onGiven}
            disabled={med.completed}
            style={{
              ...givenBtn,
              opacity: med.completed ? 0.55 : 1,
              cursor: med.completed ? "not-allowed" : "pointer",
            }}
          >
            ✓ Given
          </button>

          <button onClick={onMissed} style={missedBtn}>
            Missed
          </button>

          <button onClick={onDelete} style={deleteBtn}>
            Delete
          </button>
        </div>
      )}
    </div>
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

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#111827",
  padding: "28px",
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
  flexWrap: "wrap",
  justifyContent: "flex-end",
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

const heroPrimaryBtn = {
  border: "none",
  background: "#ffffff",
  color: "#0b4aa2",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 22px",
  fontWeight: "900",
  cursor: "pointer",
};

const heroSecondaryBtn = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 20px",
  fontWeight: "900",
  cursor: "pointer",
};

const container = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 0 30px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 30,
};

const statCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
};

const statValue = {
  margin: "12px 0 0",
  fontSize: 34,
  fontWeight: 900,
};

const section = {
  marginBottom: 34,
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
};

const sectionTitle = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 900,
};

const sectionCount = {
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 900,
  fontSize: 12,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 20,
};

const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 24,
  border: "1px solid #e9eef5",
  boxShadow: "0 10px 26px rgba(15,23,42,.05)",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 20,
};

const pillIcon = {
  width: 50,
  height: 50,
  borderRadius: 14,
  background: "#dbeafe",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
};

const medName = {
  margin: 0,
  color: "#064aa2",
  fontSize: 24,
  fontWeight: 900,
};

const medDose = {
  margin: "5px 0 0",
  color: "#64748b",
};

const dueBadge = {
  marginLeft: "auto",
  background: "#dbeafe",
  color: "#064aa2",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: 12,
};

const givenBadge = {
  ...dueBadge,
  background: "#dcfce7",
  color: "#047857",
};

const missedBadge = {
  ...dueBadge,
  background: "#fee2e2",
  color: "#b91c1c",
};

const scheduledBadge = {
  ...dueBadge,
  background: "#f3e8ff",
  color: "#7c3aed",
};

const infoBox = {
  background: "#f8fafc",
  borderRadius: 14,
  padding: 16,
};

const infoLine = {
  margin: "6px 0",
  color: "#334155",
};

const reasonBox = {
  marginTop: 14,
  background: "#fff1f2",
  color: "#b91c1c",
  borderRadius: 12,
  padding: 12,
};

const buttonRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 10,
  marginTop: 18,
};

const givenBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  height: 46,
  fontWeight: 900,
  cursor: "pointer",
};

const missedBtn = {
  border: "none",
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 999,
  height: 46,
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const deleteBtn = {
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 999,
  height: 46,
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const emptyBox = {
  background: "#fff",
  borderRadius: 18,
  padding: 24,
  color: "#64748b",
  fontWeight: 900,
  border: "1px solid #e9eef5",
};

const primaryBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  minHeight: 46,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
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
  maxWidth: 520,
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

const textarea = {
  width: "100%",
  minHeight: 120,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 14,
  resize: "none",
  boxSizing: "border-box",
  outline: "none",
};

const modalText = {
  color: "#64748b",
  lineHeight: 1.6,
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

function mapMedication(med) {
  const patientObj =
    med.patient && typeof med.patient === "object" ? med.patient : null;

  return {
    id: med._id || med.id,
    time: med.time || "12:00",
    name: med.name || "Unnamed Medication",
    dose: med.dose || "No dose",

    patientId: patientObj?._id || med.patient || "",
    patientName:
      patientObj?.name ||
      (typeof med.patient === "string" ? med.patient : "Unknown Patient"),
    patientWard: patientObj?.ward || "",
    patientBed: patientObj?.bed || "",
    patientDisease: patientObj?.disease || "",

    location: med.location || "No location",
    tag: med.tag || "ROUTINE",
    status: med.status || "DUE NOW",
    section: med.section || "noon",
    completed: Boolean(med.completed),
    actionReason: med.actionReason || "",
  };
}

function mapPatient(patient) {
  return {
    id: String(patient._id || patient.id),
    name: patient.name || "Unnamed Patient",
    age: patient.age || "",
    disease: patient.disease || "",
    ward: patient.ward || "",
    bed: patient.bed || "",
    gender: patient.gender || "",
    status: patient.status || "STABLE",
  };
}

export default function MedicationsPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);

  const [selectedMedication, setSelectedMedication] = useState(null);
  const [missedReason, setMissedReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    dose: "",
    patient: "",
    location: "",
    time: "12:00",
    tag: "ROUTINE",
  });

  const isPatient = role === "patient";
  const canManage = role === "admin" || role === "doctor" || role === "nurse";
  const canSelectPatients = role === "admin" || role === "doctor";

  const fetchPatientsForDropdown = async (currentRole) => {
    if (currentRole !== "admin" && currentRole !== "doctor") return;

    try {
      const response = await axios.get(`${PATIENT_API}/getpatients`, authConfig());

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapPatient)
        : [];

      setPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patients.");
    }
  };

  const fetchMedications = async () => {
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
        const response = await axios.get(
          `${MEDICATION_API}/mymedications`,
          authConfig()
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data.map(mapMedication)
          : [];

        setMedications(data);
        return;
      }

      if (
        currentRole !== "admin" &&
        currentRole !== "doctor" &&
        currentRole !== "nurse"
      ) {
        toast.error("You are not allowed to access medications.");
        router.push("/dashboard");
        return;
      }

      const response = await axios.get(
        `${MEDICATION_API}/getmedications`,
        authConfig()
      );

      const data = Array.isArray(response.data?.data)
        ? response.data.data.map(mapMedication)
        : [];

      setMedications(data);
      await fetchPatientsForDropdown(currentRole);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch medications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handlePatientChange = (patientId) => {
    const selectedPatient = patients.find((patient) => patient.id === patientId);

    setForm((prev) => ({
      ...prev,
      patient: patientId,
      location: selectedPatient
        ? `${selectedPatient.ward || "Ward"} • Bed ${selectedPatient.bed || "--"}`
        : prev.location,
    }));
  };

  const addMedication = async () => {
    if (!canManage) {
      toast.error("You are not allowed to add medication.");
      return;
    }

    if (!form.name || !form.dose || !form.patient || !form.location) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${MEDICATION_API}/createmedication`,
        {
          name: form.name.trim(),
          dose: form.dose.trim(),
          patient: form.patient.trim(),
          location: form.location.trim(),
          time: form.time,
          tag: form.tag,
        },
        authConfig()
      );

      const newMedication = mapMedication(response.data.data);

      setMedications((prev) => [newMedication, ...prev]);

      setForm({
        name: "",
        dose: "",
        patient: "",
        location: "",
        time: "12:00",
        tag: "ROUTINE",
      });

      setShowAddModal(false);
      toast.success("Medication added successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add medication.");
    } finally {
      setSaving(false);
    }
  };

  const markAsGiven = async (id) => {
    if (!canManage) {
      toast.error("You are not allowed to update medication.");
      return;
    }

    try {
      const response = await axios.put(
        `${MEDICATION_API}/markgiven/${id}`,
        {},
        authConfig()
      );

      const updatedMedication = mapMedication(response.data.data);

      setMedications((prev) =>
        prev.map((med) => (med.id === id ? updatedMedication : med))
      );

      toast.success("Medication marked as given.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as given.");
    }
  };

  const openMissedModal = (medication) => {
    if (!canManage) {
      toast.error("You are not allowed to update medication.");
      return;
    }

    setSelectedMedication(medication);
    setMissedReason("");
    setShowMissedModal(true);
  };

  const markAsMissed = async () => {
    if (!selectedMedication) {
      toast.error("Medication not selected.");
      return;
    }

    if (!missedReason.trim()) {
      toast.error("Please enter missed reason.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.put(
        `${MEDICATION_API}/markmissed/${selectedMedication.id}`,
        {
          actionReason: missedReason.trim(),
        },
        authConfig()
      );

      const updatedMedication = mapMedication(response.data.data);

      setMedications((prev) =>
        prev.map((med) =>
          med.id === selectedMedication.id ? updatedMedication : med
        )
      );

      setShowMissedModal(false);
      setSelectedMedication(null);
      setMissedReason("");

      toast.success("Missed medication recorded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as missed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMedication = async (id) => {
    if (!canManage) {
      toast.error("You are not allowed to delete medication.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medication?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${MEDICATION_API}/deletemedication/${id}`, authConfig());

      setMedications((prev) => prev.filter((med) => med.id !== id));

      toast.success("Medication deleted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete medication."
      );
    }
  };

  const total = medications.length;
  const completed = medications.filter((med) => med.completed).length;
  const missed = medications.filter((med) => med.status === "MISSED").length;
  const scheduled = medications.filter(
    (med) => med.status === "SCHEDULED"
  ).length;

  const morningMeds = medications.filter((med) => med.section === "morning");
  const noonMeds = medications.filter((med) => med.section === "noon");
  const eveningMeds = medications.filter((med) => med.section === "evening");

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>
              {isPatient ? "MY MEDICATION RECORDS" : "SMARTWARD MEDICATION CONTROL"}
            </div>

            <h1 style={heroTitle}>
              {isPatient ? "My Medication Schedule" : "Medication Schedule"}
            </h1>

            <p style={heroSubtitle}>
              {isPatient
                ? "View medications assigned to your linked patient record, including dosage, timing, status, and care location."
                : "Manage medication rounds, track administered and missed doses, and monitor patient medication status from SmartWard records."}
            </p>
          </div>

          <div style={heroActions}>
            <div style={roleBox}>
              <span style={roleLabel}>Access Role</span>
              <strong style={roleValue}>{role || "Loading..."}</strong>
            </div>

            <button onClick={fetchMedications} style={heroSecondaryBtn}>
              Refresh
            </button>

            {canManage && (
              <button onClick={() => setShowAddModal(true)} style={heroPrimaryBtn}>
                + Add Medication
              </button>
            )}
          </div>
        </section>

        <section style={container}>
          <div style={statsGrid}>
            <StatCard label="TOTAL DUE TODAY" value={total} color="#064aa2" />
            <StatCard label="COMPLETED" value={completed} color="#047857" />
            <StatCard label="MISSED/LATE" value={missed} color="#cf171d" />
            <StatCard label="SCHEDULED" value={scheduled} color="#7c3aed" />
          </div>

          {loading ? (
            <div style={emptyBox}>Loading medications...</div>
          ) : (
            <>
              <MedicationSection
                title="08:00 Morning Rounds"
                meds={morningMeds}
                emptyText="No morning medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />

              <MedicationSection
                title="12:00 Noon Rounds"
                meds={noonMeds}
                emptyText="No noon medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />

              <MedicationSection
                title="18:00 Evening Rounds"
                meds={eveningMeds}
                emptyText="No evening medications added."
                onGiven={markAsGiven}
                onMissed={openMissedModal}
                onDelete={deleteMedication}
                canManage={canManage}
              />
            </>
          )}
        </section>

        {showAddModal && canManage && (
          <Modal title="Add Medication" onClose={() => setShowAddModal(false)}>
            <Input
              label="Medication Name"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="e.g. Paracetamol"
            />

            <Input
              label="Dose"
              value={form.dose}
              onChange={(value) => setForm({ ...form, dose: value })}
              placeholder="e.g. 500mg Tablet"
            />

            {canSelectPatients ? (
              <label style={label}>
                Select Patient
                <select
                  value={form.patient}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  style={input}
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — {patient.ward} / Bed {patient.bed}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Input
                label="Patient Record ID"
                value={form.patient}
                onChange={(value) => setForm({ ...form, patient: value })}
                placeholder="Paste patient record ID"
              />
            )}

            <Input
              label="Location"
              value={form.location}
              onChange={(value) => setForm({ ...form, location: value })}
              placeholder="e.g. ICU 12 • Bed A"
            />

            <label style={label}>
              Time
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={input}
              >
                <option value="08:00">08:00</option>
                <option value="12:00">12:00</option>
                <option value="18:00">18:00</option>
              </select>
            </label>

            <label style={label}>
              Type
              <select
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                style={input}
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="STAT ORDER">STAT ORDER</option>
                <option value="PRN">PRN</option>
              </select>
            </label>

            <div style={modalActions}>
              <button onClick={() => setShowAddModal(false)} style={cancelBtn}>
                Cancel
              </button>

              <button
                onClick={addMedication}
                disabled={saving}
                style={{
                  ...primaryBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Adding..." : "Add Medication"}
              </button>
            </div>
          </Modal>
        )}

        {showMissedModal && (
          <Modal
            title="Missed Medication Action"
            onClose={() => setShowMissedModal(false)}
          >
            <p style={modalText}>
              Medication: <strong>{selectedMedication?.name}</strong>
              <br />
              Patient: <strong>{selectedMedication?.patientName}</strong>
            </p>

            <textarea
              value={missedReason}
              onChange={(e) => setMissedReason(e.target.value)}
              placeholder="Enter reason e.g. patient refused, unavailable, delayed..."
              style={textarea}
            />

            <div style={modalActions}>
              <button
                onClick={() => setShowMissedModal(false)}
                style={cancelBtn}
              >
                Cancel
              </button>

              <button
                onClick={markAsMissed}
                disabled={saving}
                style={{
                  ...primaryBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Submit Action"}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </AppShell>
  );
}

function MedicationSection({
  title,
  meds,
  emptyText,
  onGiven,
  onMissed,
  onDelete,
  canManage,
}) {
  return (
    <div style={section}>
      <div style={sectionHeader}>
        <h2 style={sectionTitle}>{title}</h2>
        <span style={sectionCount}>{meds.length} records</span>
      </div>

      {meds.length === 0 ? (
        <div style={emptyBox}>{emptyText}</div>
      ) : (
        <div style={grid}>
          {meds.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              onGiven={() => onGiven(med.id)}
              onMissed={() => onMissed(med)}
              onDelete={() => onDelete(med.id)}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationCard({ med, onGiven, onMissed, onDelete, canManage }) {
  const statusStyle =
    med.status === "ADMINISTERED"
      ? givenBadge
      : med.status === "MISSED"
      ? missedBadge
      : med.status === "SCHEDULED"
      ? scheduledBadge
      : dueBadge;

  return (
    <div style={card}>
      <div style={cardTop}>
        <div style={pillIcon}>💊</div>

        <div>
          <h3 style={medName}>{med.name}</h3>
          <p style={medDose}>{med.dose}</p>
        </div>

        <span style={statusStyle}>{med.status}</span>
      </div>

      <div style={infoBox}>
        <p style={infoLine}>
          <strong>Patient:</strong> {med.patientName}
        </p>

        {med.patientWard || med.patientBed ? (
          <p style={infoLine}>
            <strong>Ward / Bed:</strong> {med.patientWard || "N/A"} /{" "}
            {med.patientBed || "N/A"}
          </p>
        ) : null}

        <p style={infoLine}>
          <strong>Location:</strong> {med.location}
        </p>

        <p style={infoLine}>
          <strong>Time:</strong> {med.time}
        </p>

        <p style={infoLine}>
          <strong>Type:</strong> {med.tag}
        </p>
      </div>

      {med.actionReason && (
        <div style={reasonBox}>
          <strong>Missed Reason:</strong> {med.actionReason}
        </div>
      )}

      {canManage && (
        <div style={buttonRow}>
          <button
            onClick={onGiven}
            disabled={med.completed}
            style={{
              ...givenBtn,
              opacity: med.completed ? 0.55 : 1,
              cursor: med.completed ? "not-allowed" : "pointer",
            }}
          >
            ✓ Given
          </button>

          <button onClick={onMissed} style={missedBtn}>
            Missed
          </button>

          <button onClick={onDelete} style={deleteBtn}>
            Delete
          </button>
        </div>
      )}
    </div>
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

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#111827",
  padding: "28px",
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
  flexWrap: "wrap",
  justifyContent: "flex-end",
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

const heroPrimaryBtn = {
  border: "none",
  background: "#ffffff",
  color: "#0b4aa2",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 22px",
  fontWeight: "900",
  cursor: "pointer",
};

const heroSecondaryBtn = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  borderRadius: "999px",
  minHeight: 48,
  padding: "0 20px",
  fontWeight: "900",
  cursor: "pointer",
};

const container = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 0 30px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 30,
};

const statCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e9eef5",
  boxShadow: "0 8px 24px rgba(15,23,42,.04)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
};

const statValue = {
  margin: "12px 0 0",
  fontSize: 34,
  fontWeight: 900,
};

const section = {
  marginBottom: 34,
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
};

const sectionTitle = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 900,
};

const sectionCount = {
  background: "#e2e8f0",
  color: "#334155",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 900,
  fontSize: 12,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 20,
};

const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 24,
  border: "1px solid #e9eef5",
  boxShadow: "0 10px 26px rgba(15,23,42,.05)",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 20,
};

const pillIcon = {
  width: 50,
  height: 50,
  borderRadius: 14,
  background: "#dbeafe",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
};

const medName = {
  margin: 0,
  color: "#064aa2",
  fontSize: 24,
  fontWeight: 900,
};

const medDose = {
  margin: "5px 0 0",
  color: "#64748b",
};

const dueBadge = {
  marginLeft: "auto",
  background: "#dbeafe",
  color: "#064aa2",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: 12,
};

const givenBadge = {
  ...dueBadge,
  background: "#dcfce7",
  color: "#047857",
};

const missedBadge = {
  ...dueBadge,
  background: "#fee2e2",
  color: "#b91c1c",
};

const scheduledBadge = {
  ...dueBadge,
  background: "#f3e8ff",
  color: "#7c3aed",
};

const infoBox = {
  background: "#f8fafc",
  borderRadius: 14,
  padding: 16,
};

const infoLine = {
  margin: "6px 0",
  color: "#334155",
};

const reasonBox = {
  marginTop: 14,
  background: "#fff1f2",
  color: "#b91c1c",
  borderRadius: 12,
  padding: 12,
};

const buttonRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 10,
  marginTop: 18,
};

const givenBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  height: 46,
  fontWeight: 900,
  cursor: "pointer",
};

const missedBtn = {
  border: "none",
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 999,
  height: 46,
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const deleteBtn = {
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 999,
  height: 46,
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const emptyBox = {
  background: "#fff",
  borderRadius: 18,
  padding: 24,
  color: "#64748b",
  fontWeight: 900,
  border: "1px solid #e9eef5",
};

const primaryBtn = {
  border: "none",
  background: "#064aa2",
  color: "#fff",
  borderRadius: 999,
  minHeight: 46,
  padding: "0 22px",
  fontWeight: 900,
  cursor: "pointer",
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
  maxWidth: 520,
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

const textarea = {
  width: "100%",
  minHeight: 120,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 14,
  resize: "none",
  boxSizing: "border-box",
  outline: "none",
};

const modalText = {
  color: "#64748b",
  lineHeight: 1.6,
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