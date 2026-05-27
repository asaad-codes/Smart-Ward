"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PATIENT_API = `${API_BASE_URL}/patient`;
const WARD_API = `${API_BASE_URL}/ward`;
const VITAL_API = `${API_BASE_URL}/vital`;
const MEDICATION_API = `${API_BASE_URL}/medication`; 

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("smartward_token");
}

function getStoredUser() {
  if (typeof window === "undefined") return null;

  const user =
    localStorage.getItem("user") || localStorage.getItem("smartwardUser");

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

function mapPatient(patient) {
  return {
    id: patient._id || patient.id,
    name: patient.name || "Unnamed Patient",
    age: patient.age || "--",
    disease: patient.disease || "Not specified",
    ward: patient.ward || "No ward",
    bed: patient.bed || "--",
    gender: patient.gender || "other",
    status: patient.status || "STABLE",
    admittedBy: patient.admittedBy?.name || "SmartWard Staff",
    createdAt: patient.createdAt,
  };
}

function mapWard(ward) {
  return {
    id: ward._id || ward.id,
    name: ward.name || "Unnamed Ward",
    type: ward.type || "General Care",
    capacity: Number(ward.capacity || 0),
    occupied: Number(ward.occupied || 0),
    floor: ward.floor || "Floor 1",
    status: ward.status || "AVAILABLE",
  };
}

function mapMedication(med) {
  const patientName =
    typeof med.patient === "object"
      ? med.patient?.name || "Unknown Patient"
      : med.patient || "Unknown Patient";

  return {
    id: med._id || med.id,
    time: med.time || "12:00",
    name: med.name || "Unnamed Medication",
    dose: med.dose || "No dose",
    patient: patientName,
    location: med.location || "No location",
    tag: med.tag || "ROUTINE",
    status: med.status || "DUE NOW",
    section: med.section || "noon",
    completed: Boolean(med.completed),
    actionReason: med.actionReason || "",
  };
}

function mapVital(vital) {
  return {
    id: vital._id || vital.id,
    heartRate: vital.heartRate || 0,
    bp: vital.bp || "120/80",
    temp: vital.temp || 36.5,
    spo2: vital.spo2 || 98,
    status: vital.status || "STABLE",
    notes: vital.notes || "",
    recordedBy: vital.recordedBy?.name || "SmartWard Staff",
    createdAt: vital.createdAt,
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [myPatient, setMyPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(null);

  const role = user?.role || "patient";

  const cardStyle = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
  };

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      setUser(storedUser);
      setLoading(true);

      const currentRole = storedUser.role;

      if (currentRole === "patient") {
        const [patientRes, medicationRes] = await Promise.all([
          axios.get(`${PATIENT_API}/me`, authConfig()),
          axios.get(`${MEDICATION_API}/mymedications`, authConfig()),
        ]);

        setMyPatient(
          patientRes.data?.data ? mapPatient(patientRes.data.data) : null
        );

        setMedications(
          Array.isArray(medicationRes.data?.data)
            ? medicationRes.data.data.map(mapMedication)
            : []
        );

        setPatients([]);
        setWards([]);
        setVitals([]);
        return;
      }

      if (currentRole === "nurse") {
        const [vitalRes, medicationRes] = await Promise.all([
          axios.get(`${VITAL_API}/getvitals`, authConfig()),
          axios.get(`${MEDICATION_API}/getmedications`, authConfig()),
        ]);

        setVitals(
          Array.isArray(vitalRes.data?.data)
            ? vitalRes.data.data.map(mapVital)
            : []
        );

        setMedications(
          Array.isArray(medicationRes.data?.data)
            ? medicationRes.data.data.map(mapMedication)
            : []
        );

        setPatients([]);
        setWards([]);
        setMyPatient(null);
        return;
      }

      const [patientRes, wardRes, vitalRes, medicationRes] = await Promise.all([
        axios.get(`${PATIENT_API}/getpatients`, authConfig()),
        axios.get(`${WARD_API}/getwards`, authConfig()),
        axios.get(`${VITAL_API}/getvitals`, authConfig()),
        axios.get(`${MEDICATION_API}/getmedications`, authConfig()),
      ]);

      setPatients(
        Array.isArray(patientRes.data?.data)
          ? patientRes.data.data.map(mapPatient)
          : []
      );

      setWards(
        Array.isArray(wardRes.data?.data) ? wardRes.data.data.map(mapWard) : []
      );

      setVitals(
        Array.isArray(vitalRes.data?.data)
          ? vitalRes.data.data.map(mapVital)
          : []
      );

      setMedications(
        Array.isArray(medicationRes.data?.data)
          ? medicationRes.data.data.map(mapMedication)
          : []
      );

      setMyPatient(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const totalPatients = patients.length;
  const activeWards = wards.length;

  const criticalPatients = patients.filter(
    (patient) => String(patient.status).toUpperCase() === "CRITICAL"
  ).length;

  const pendingMedications = medications.filter(
    (med) => !med.completed && med.status !== "ADMINISTERED"
  ).length;

  const missedMedications = medications.filter(
    (med) => med.status === "MISSED"
  ).length;

  const criticalVitals = vitals.filter(
    (vital) => vital.status === "CRITICAL" || vital.status === "HIGH"
  ).length;

  const totalBeds = wards.reduce((sum, ward) => sum + Number(ward.capacity), 0);
  const occupiedBeds = wards.reduce(
    (sum, ward) => sum + Number(ward.occupied),
    0
  );

  const globalOccupancy = totalBeds
    ? Math.round((occupiedBeds / totalBeds) * 100)
    : 0;

  const visibleWards = wards.slice(0, 4);
  const visibleMedications = medications.slice(0, 5);
  const visibleVitals = vitals.slice(0, 5);

  const statCards = useMemo(() => {
    if (role === "patient") {
      return [
        {
          label: "My Status",
          value: myPatient?.status || "N/A",
          note: "Patient record",
          color: "#2563eb",
          bg: "#eff6ff",
        },
        {
          label: "Ward",
          value: myPatient?.ward || "N/A",
          note: `Bed ${myPatient?.bed || "--"}`,
          color: "#059669",
          bg: "#ecfdf5",
        },
        {
          label: "My Medications",
          value: medications.length,
          note: `${pendingMedications} pending`,
          color: "#7c3aed",
          bg: "#f5f3ff",
        },
        {
          label: "Missed",
          value: missedMedications,
          note: "Medication alerts",
          color: "#dc2626",
          bg: "#fef2f2",
        },
      ];
    }

    if (role === "nurse") {
      return [
        {
          label: "Medication Tasks",
          value: medications.length,
          note: `${pendingMedications} pending`,
          color: "#7c3aed",
          bg: "#f5f3ff",
        },
        {
          label: "Missed Medications",
          value: missedMedications,
          note: "Needs action",
          color: "#dc2626",
          bg: "#fef2f2",
        },
        {
          label: "Vital Records",
          value: vitals.length,
          note: "Live records",
          color: "#2563eb",
          bg: "#eff6ff",
        },
        {
          label: "Critical Vitals",
          value: criticalVitals,
          note: "Review required",
          color: "#ea580c",
          bg: "#fff7ed",
        },
      ];
    }

    return [
      {
        label: "Total Patients",
        value: totalPatients,
        note: "Live MongoDB",
        color: "#2563eb",
        bg: "#eff6ff",
      },
      {
        label: "Active Wards",
        value: activeWards,
        note: `${globalOccupancy}% occupied`,
        color: "#059669",
        bg: "#ecfdf5",
      },
      {
        label: "Critical Patients",
        value: criticalPatients,
        note: "Needs attention",
        color: "#dc2626",
        bg: "#fef2f2",
      },
      {
        label: "Pending Medications",
        value: pendingMedications,
        note: "Due soon",
        color: "#7c3aed",
        bg: "#f5f3ff",
      },
    ];
  }, [
    role,
    myPatient,
    medications.length,
    pendingMedications,
    missedMedications,
    vitals.length,
    criticalVitals,
    totalPatients,
    activeWards,
    criticalPatients,
    globalOccupancy,
  ]);

  const markMedicationDone = async (id) => {
    try {
      const response = await axios.put(
        `${MEDICATION_API}/markgiven/${id}`,
        {},
        authConfig()
      );

      const updated = mapMedication(response.data.data);

      setMedications((prev) =>
        prev.map((med) => (med.id === id ? updated : med))
      );

      toast.success("Medication marked as given.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update medication.");
    }
  };

  const heroTitle =
    role === "patient"
      ? "My Care Dashboard"
      : role === "nurse"
      ? "Nursing Workspace"
      : "Hospital Command Center";

  const heroText =
    role === "patient"
      ? "View your own medical record, medication schedule, and downloadable care report."
      : role === "nurse"
      ? "Monitor medication rounds and vital records from your nursing workspace."
      : "Monitor patients, wards, medication tasks, vitals, and urgent clinical alerts from one clear workspace.";

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
                    textTransform: "uppercase",
                  }}
                >
                  SMARTWARD {role} OVERVIEW
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
                  {heroTitle}
                </h1>

                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: "620px",
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "#dbeafe",
                  }}
                >
                  {heroText}
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

                <p style={{ margin: 0, fontSize: "14px", fontWeight: "800" }}>
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

                <button
                  onClick={fetchDashboardData}
                  style={{
                    marginTop: "12px",
                    border: "none",
                    background: "#ffffff",
                    color: "#0b4aa2",
                    borderRadius: "999px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div
              style={{
                ...cardStyle,
                padding: "24px",
                marginBottom: "22px",
                color: "#64748b",
                fontWeight: "900",
              }}
            >
              Loading dashboard data...
            </div>
          )}

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
                  {String(item.label).slice(0, 2).toUpperCase()}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: String(item.value).length > 8 ? "20px" : "34px",
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

                <span
                  style={{
                    display: "inline-flex",
                    marginTop: "10px",
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
            ))}
          </div>

          {role === "patient" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "22px",
                alignItems: "start",
              }}
            >
              <div style={{ ...cardStyle, padding: "22px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                  My Patient Details
                </h2>

                <p
                  style={{
                    margin: "6px 0 18px",
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  This record is linked only with your account.
                </p>

                {myPatient ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {[
                      ["Name", myPatient.name],
                      ["Age", myPatient.age],
                      ["Gender", myPatient.gender],
                      ["Disease", myPatient.disease],
                      ["Ward", myPatient.ward],
                      ["Bed", myPatient.bed],
                      ["Status", myPatient.status],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom: "1px solid #edf2f7",
                          paddingBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          {label}
                        </span>

                        <span
                          style={{
                            color: "#0f172a",
                            fontSize: "13px",
                            fontWeight: "900",
                            textTransform: "capitalize",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#dc2626", fontWeight: "800" }}>
                    No patient record linked with this account.
                  </p>
                )}

                <button
                  onClick={() => router.push("/reports")}
                  style={{
                    marginTop: "18px",
                    width: "100%",
                    height: "44px",
                    border: "none",
                    background: "#0b4aa2",
                    color: "#ffffff",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  Download My Report →
                </button>
              </div>

              <div style={{ ...cardStyle, padding: "22px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                  My Medications
                </h2>

                <p
                  style={{
                    margin: "6px 0 18px",
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Medication schedule assigned to your patient record.
                </p>

                <div style={{ display: "grid", gap: "11px" }}>
                  {visibleMedications.length > 0 ? (
                    visibleMedications.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          border: "1px solid #edf2f7",
                          borderRadius: "18px",
                          padding: "13px 14px",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: "14px",
                                fontWeight: "900",
                              }}
                            >
                              {task.name}
                            </p>

                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              {task.dose} • {task.time} • {task.location}
                            </p>
                          </div>

                          <span
                            style={{
                              height: "fit-content",
                              background:
                                task.status === "MISSED"
                                  ? "#fee2e2"
                                  : task.status === "ADMINISTERED"
                                  ? "#dcfce7"
                                  : "#eff6ff",
                              color:
                                task.status === "MISSED"
                                  ? "#dc2626"
                                  : task.status === "ADMINISTERED"
                                  ? "#047857"
                                  : "#0b4aa2",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              fontSize: "10px",
                              fontWeight: "900",
                            }}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #edf2f7",
                        borderRadius: "18px",
                        padding: "16px",
                        color: "#64748b",
                        fontWeight: "800",
                      }}
                    >
                      No medication assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {role === "nurse" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "22px",
                alignItems: "start",
              }}
            >
              <div style={{ ...cardStyle, padding: "22px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                  Medication Tasks
                </h2>

                <p
                  style={{
                    margin: "6px 0 18px",
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Nursing medication actions.
                </p>

                <div style={{ display: "grid", gap: "11px" }}>
                  {visibleMedications.length > 0 ? (
                    visibleMedications.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 95px 42px",
                          gap: "14px",
                          alignItems: "center",
                          border: "1px solid #edf2f7",
                          borderRadius: "18px",
                          padding: "13px 14px",
                          background: "#ffffff",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: "14px",
                              fontWeight: "900",
                            }}
                          >
                            {task.name}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            {task.patient} • {task.location}
                          </p>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color:
                              task.status === "MISSED"
                                ? "#dc2626"
                                : task.status === "ADMINISTERED"
                                ? "#047857"
                                : "#7c3aed",
                            fontSize: "12px",
                            fontWeight: "900",
                          }}
                        >
                          {task.status}
                        </p>

                        <button
                          onClick={() => markMedicationDone(task.id)}
                          disabled={task.completed}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "13px",
                            border: "1px solid #cbd5e1",
                            background: task.completed ? "#dcfce7" : "#ffffff",
                            color: task.completed ? "#047857" : "#94a3b8",
                            fontSize: "16px",
                            fontWeight: "900",
                            cursor: task.completed ? "default" : "pointer",
                          }}
                        >
                          ✓
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#64748b", fontWeight: "800" }}>
                      No medication tasks found.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "22px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                  Latest Vitals
                </h2>

                <p
                  style={{
                    margin: "6px 0 18px",
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Recent vital monitoring records.
                </p>

                <div style={{ display: "grid", gap: "11px" }}>
                  {visibleVitals.length > 0 ? (
                    visibleVitals.map((vital) => (
                      <div
                        key={vital.id}
                        style={{
                          border: "1px solid #edf2f7",
                          borderRadius: "18px",
                          padding: "13px 14px",
                          background: "#ffffff",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: "14px",
                            fontWeight: "900",
                          }}
                        >
                          BP {vital.bp} • HR {vital.heartRate} • SpO2{" "}
                          {vital.spo2}%
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: "700",
                          }}
                        >
                          Status: {vital.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#64748b", fontWeight: "800" }}>
                      No vital records found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(role === "admin" || role === "doctor") && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 0.9fr",
                gap: "22px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: "18px" }}>
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
                        Current capacity and bed availability.
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
                    {visibleWards.length > 0 ? (
                      visibleWards.map((ward) => {
                        const percent = ward.capacity
                          ? Math.round((ward.occupied / ward.capacity) * 100)
                          : 0;

                        return (
                          <div
                            key={ward.id}
                            style={{ ...cardStyle, padding: "18px" }}
                          >
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
                                margin: "5px 0 14px",
                                color: "#64748b",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {ward.occupied} of {ward.capacity} beds occupied
                            </p>

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
                                  width: `${percent}%`,
                                  height: "100%",
                                  background:
                                    percent >= 90
                                      ? "#dc2626"
                                      : percent >= 70
                                      ? "#f59e0b"
                                      : "#2563eb",
                                  borderRadius: "999px",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ ...cardStyle, padding: "18px" }}>
                        No ward data found.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "900" }}>
                    Medication Tasks
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 16px",
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: "600",
                    }}
                  >
                    Track scheduled and overdue medication rounds.
                  </p>

                  <div style={{ display: "grid", gap: "11px" }}>
                    {visibleMedications.length > 0 ? (
                      visibleMedications.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 120px 42px",
                            gap: "14px",
                            alignItems: "center",
                            border: "1px solid #edf2f7",
                            borderRadius: "18px",
                            padding: "13px 14px",
                            background: "#ffffff",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: "14px",
                                fontWeight: "900",
                              }}
                            >
                              {task.name}
                            </p>

                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              {task.patient} • {task.location}
                            </p>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              color:
                                task.status === "MISSED"
                                  ? "#dc2626"
                                  : task.status === "ADMINISTERED"
                                  ? "#047857"
                                  : "#7c3aed",
                              fontSize: "12px",
                              fontWeight: "900",
                            }}
                          >
                            {task.status}
                          </p>

                          <button
                            onClick={() => markMedicationDone(task.id)}
                            disabled={task.completed}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "13px",
                              border: "1px solid #cbd5e1",
                              background: task.completed ? "#dcfce7" : "#ffffff",
                              color: task.completed ? "#047857" : "#94a3b8",
                              fontSize: "16px",
                              fontWeight: "900",
                              cursor: task.completed ? "default" : "pointer",
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#64748b", fontWeight: "800" }}>
                        No medication tasks found.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "18px" }}>
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
                      ["Vitals Monitoring", "/vitals"],
                      ["Medication Schedule", "/medications"],
                      ["Download Reports", "/reports"],
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

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900" }}>
                    Latest Vitals
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gap: "11px",
                      marginTop: "16px",
                    }}
                  >
                    {visibleVitals.length > 0 ? (
                      visibleVitals.map((vital) => (
                        <div
                          key={vital.id}
                          style={{
                            border: "1px solid #edf2f7",
                            borderRadius: "18px",
                            padding: "13px 14px",
                            background: "#ffffff",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: "14px",
                              fontWeight: "900",
                            }}
                          >
                            BP {vital.bp} • HR {vital.heartRate} • SpO2{" "}
                            {vital.spo2}%
                          </p>

                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#64748b",
                              fontWeight: "700",
                            }}
                          >
                            Status: {vital.status}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#64748b", fontWeight: "800" }}>
                        No vital records found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
} 