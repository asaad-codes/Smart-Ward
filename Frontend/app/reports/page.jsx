"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppShell from "../components/AppShell";

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

function getPatientIdFromRecord(record) {
  if (!record?.patient) return "";

  if (typeof record.patient === "object") {
    return String(record.patient._id || record.patient.id || "");
  }

  return String(record.patient);
}

function formatDate(value) {
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "N/A";
  }
}

function mapPatient(patient) {
  return {
    id: String(patient._id || patient.id),
    name: patient.name || "Unnamed Patient",
    age: patient.age || "N/A",
    gender: patient.gender || "N/A",
    disease: patient.disease || "N/A",
    ward: patient.ward || "N/A",
    bed: patient.bed || "N/A",
    status: patient.status || "STABLE",
    admittedBy: patient.admittedBy?.name || "SmartWard Staff",
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

function mapMedication(med) {
  return {
    id: med._id || med.id,
    name: med.name || "Unnamed Medication",
    dose: med.dose || "N/A",
    time: med.time || "N/A",
    location: med.location || "N/A",
    tag: med.tag || "ROUTINE",
    status: med.status || "DUE NOW",
    completed: med.completed ? "Yes" : "No",
    actionReason: med.actionReason || "",
    createdAt: med.createdAt,
    patientId: getPatientIdFromRecord(med),
  };
}

function mapVital(vital) {
  return {
    id: vital._id || vital.id,
    heartRate: vital.heartRate || "N/A",
    bp: vital.bp || "N/A",
    temp: vital.temp || "N/A",
    spo2: vital.spo2 || "N/A",
    status: vital.status || "STABLE",
    notes: vital.notes || "",
    recordedBy: vital.recordedBy?.name || "SmartWard Staff",
    createdAt: vital.createdAt,
    patientId: getPatientIdFromRecord(vital),
  };
}

function sanitizeFileName(name) {
  return String(name || "patient")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || "";

  const selectedPatient = useMemo(() => {
    return patients.find((patient) => patient.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const selectedMedications = useMemo(() => {
    if (!selectedPatientId) return [];

    if (role === "patient") return medications;

    return medications.filter((med) => med.patientId === selectedPatientId);
  }, [medications, selectedPatientId, role]);

  const selectedVitals = useMemo(() => {
    if (!selectedPatientId) return [];

    if (role === "patient") return vitals;

    return vitals.filter((vital) => vital.patientId === selectedPatientId);
  }, [vitals, selectedPatientId, role]);

  const canAccessReports =
    role === "admin" || role === "doctor" || role === "patient";

  const fetchReportData = async () => {
    try {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      setUser(storedUser);

      if (
        storedUser.role !== "admin" &&
        storedUser.role !== "doctor" &&
        storedUser.role !== "patient"
      ) {
        toast.error("You are not allowed to access reports.");
        router.push("/dashboard");
        return;
      }

      setLoading(true);

      if (storedUser.role === "patient") {
        const [patientRes, medRes, vitalRes] = await Promise.all([
          axios.get(`${PATIENT_API}/me`, authConfig()),
          axios.get(`${MEDICATION_API}/mymedications`, authConfig()),
          axios.get(`${VITAL_API}/myvitals`, authConfig()),
        ]);

        const patient = patientRes.data?.data
          ? mapPatient(patientRes.data.data)
          : null;

        setPatients(patient ? [patient] : []);
        setSelectedPatientId(patient?.id || "");

        setMedications(
          Array.isArray(medRes.data?.data)
            ? medRes.data.data.map(mapMedication)
            : []
        );

        setVitals(
          Array.isArray(vitalRes.data?.data)
            ? vitalRes.data.data.map(mapVital)
            : []
        );

        return;
      }

      const [patientRes, medRes, vitalRes] = await Promise.all([
        axios.get(`${PATIENT_API}/getpatients`, authConfig()),
        axios.get(`${MEDICATION_API}/getmedications`, authConfig()),
        axios.get(`${VITAL_API}/getvitals`, authConfig()),
      ]);

      const patientList = Array.isArray(patientRes.data?.data)
        ? patientRes.data.data.map(mapPatient)
        : [];

      const medList = Array.isArray(medRes.data?.data)
        ? medRes.data.data.map(mapMedication)
        : [];

      const vitalList = Array.isArray(vitalRes.data?.data)
        ? vitalRes.data.data.map(mapVital)
        : [];

      setPatients(patientList);
      setMedications(medList);
      setVitals(vitalList);

      const patientIdFromUrl = searchParams.get("patientId");

      if (patientIdFromUrl) {
        setSelectedPatientId(patientIdFromUrl);
      } else if (patientList.length > 0) {
        setSelectedPatientId(patientList[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const downloadPDF = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first.");
      return;
    }

    const doc = new jsPDF();

    const generatedBy = user?.name || user?.fullName || "SmartWard User";
    const generatedRole = user?.role || "user";
    const generatedAt = new Date().toLocaleString();

    doc.setFillColor(11, 74, 162);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("SmartWard Patient Report", 14, 18);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`Generated By: ${generatedBy} (${generatedRole})`, 14, 38);
    doc.text(`Generated At: ${generatedAt}`, 14, 44);
    doc.text(`Report Type: Clinical Patient Summary`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Patient Field", "Information"]],
      body: [
        ["Patient ID", selectedPatient.id],
        ["Name", selectedPatient.name],
        ["Age", String(selectedPatient.age)],
        ["Gender", selectedPatient.gender],
        ["Disease / Condition", selectedPatient.disease],
        ["Ward", selectedPatient.ward],
        ["Bed", selectedPatient.bed],
        ["Status", selectedPatient.status],
        ["Admitted By", selectedPatient.admittedBy],
        ["Created At", formatDate(selectedPatient.createdAt)],
        ["Last Updated", formatDate(selectedPatient.updatedAt)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [11, 74, 162],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
      },
    });

    let y = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setTextColor(11, 74, 162);
    doc.text("Medication Records", 14, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Time", "Medicine", "Dose", "Location", "Status", "Completed"]],
      body:
        selectedMedications.length > 0
          ? selectedMedications.map((med) => [
              med.time,
              med.name,
              med.dose,
              med.location,
              med.status,
              med.completed,
            ])
          : [["N/A", "No medication records found", "N/A", "N/A", "N/A", "N/A"]],
      theme: "grid",
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setTextColor(11, 74, 162);
    doc.text("Vital Records", 14, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Date", "BP", "Heart Rate", "Temp", "SpO2", "Status", "Recorded By"]],
      body:
        selectedVitals.length > 0
          ? selectedVitals.map((vital) => [
              formatDate(vital.createdAt),
              vital.bp,
              String(vital.heartRate),
              String(vital.temp),
              `${vital.spo2}%`,
              vital.status,
              vital.recordedBy,
            ])
          : [["N/A", "N/A", "N/A", "N/A", "N/A", "No vital records found", "N/A"]],
      theme: "grid",
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
      },
    });

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `SmartWard Clinical Management Platform • Page ${i} of ${pageCount}`,
        14,
        288
      );
    }

    doc.save(`smartward_report_${sanitizeFileName(selectedPatient.name)}.pdf`);

    toast.success("PDF report downloaded.");
  };

  if (loading) {
    return (
      <AppShell>
        <div style={loadingBox}>Loading report data...</div>
      </AppShell>
    );
  }

  if (!canAccessReports) {
    return (
      <AppShell>
        <div style={loadingBox}>Access denied.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>SMARTWARD REPORTS</div>

            <h1 style={title}>
              {role === "patient" ? "My Medical Report" : "Patient Reports"}
            </h1>

            <p style={subtitle}>
              {role === "patient"
                ? "Download your own clinical report including patient details, medications, and vitals."
                : "Select a patient and download a full PDF report with patient details, medications, and vitals."}
            </p>
          </div>

          <button onClick={downloadPDF} style={downloadBtn}>
            📄 Download PDF
          </button>
        </section>

        {role !== "patient" && (
          <section style={filterCard}>
            <label style={label}>Select Patient</label>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={select}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} — {patient.ward} / Bed {patient.bed}
                </option>
              ))}
            </select>
          </section>
        )}

        {!selectedPatient ? (
          <div style={emptyBox}>No patient selected or no patient record found.</div>
        ) : (
          <>
            <section style={grid}>
              <div style={card}>
                <div style={cardLabel}>Patient Name</div>
                <div style={cardValue}>{selectedPatient.name}</div>
              </div>

              <div style={card}>
                <div style={cardLabel}>Condition</div>
                <div style={cardValue}>{selectedPatient.disease}</div>
              </div>

              <div style={card}>
                <div style={cardLabel}>Ward / Bed</div>
                <div style={cardValue}>
                  {selectedPatient.ward} / {selectedPatient.bed}
                </div>
              </div>

              <div style={card}>
                <div style={cardLabel}>Status</div>
                <div style={cardValue}>{selectedPatient.status}</div>
              </div>
            </section>

            <section style={twoColumn}>
              <div style={panel}>
                <h2 style={panelTitle}>Patient Details</h2>

                <InfoRow label="Patient ID" value={selectedPatient.id} />
                <InfoRow label="Age" value={selectedPatient.age} />
                <InfoRow label="Gender" value={selectedPatient.gender} />
                <InfoRow label="Admitted By" value={selectedPatient.admittedBy} />
                <InfoRow label="Created At" value={formatDate(selectedPatient.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(selectedPatient.updatedAt)} />
              </div>

              <div style={panel}>
                <h2 style={panelTitle}>Report Summary</h2>

                <InfoRow label="Medication Records" value={selectedMedications.length} />
                <InfoRow label="Vital Records" value={selectedVitals.length} />
                <InfoRow label="Generated By" value={user?.name || user?.fullName || "SmartWard User"} />
                <InfoRow label="Role" value={role} />
              </div>
            </section>

            <section style={panel}>
              <h2 style={panelTitle}>Medications</h2>

              <table style={table}>
                <thead>
                  <tr>
                    {["Time", "Medicine", "Dose", "Location", "Status"].map(
                      (head) => (
                        <th key={head} style={th}>
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {selectedMedications.length > 0 ? (
                    selectedMedications.map((med) => (
                      <tr key={med.id}>
                        <td style={td}>{med.time}</td>
                        <td style={td}>{med.name}</td>
                        <td style={td}>{med.dose}</td>
                        <td style={td}>{med.location}</td>
                        <td style={td}>{med.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={td} colSpan={5}>
                        No medication records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section style={panel}>
              <h2 style={panelTitle}>Vitals</h2>

              <table style={table}>
                <thead>
                  <tr>
                    {["Date", "BP", "Heart Rate", "Temp", "SpO2", "Status"].map(
                      (head) => (
                        <th key={head} style={th}>
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {selectedVitals.length > 0 ? (
                    selectedVitals.map((vital) => (
                      <tr key={vital.id}>
                        <td style={td}>{formatDate(vital.createdAt)}</td>
                        <td style={td}>{vital.bp}</td>
                        <td style={td}>{vital.heartRate}</td>
                        <td style={td}>{vital.temp}</td>
                        <td style={td}>{vital.spo2}%</td>
                        <td style={td}>{vital.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={td} colSpan={6}>
                        No vital records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}</span>
      <span style={infoValue}>{value || "N/A"}</span>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "28px",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
};

const loadingBox = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "900",
  color: "#0b4aa2",
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

const title = {
  margin: 0,
  fontSize: "34px",
  fontWeight: "900",
};

const subtitle = {
  margin: "10px 0 0",
  maxWidth: "620px",
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#dbeafe",
};

const downloadBtn = {
  height: "48px",
  border: "none",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#0b4aa2",
  padding: "0 22px",
  fontSize: "14px",
  fontWeight: "900",
  cursor: "pointer",
};

const filterCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "22px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const label = {
  display: "block",
  fontSize: "12px",
  fontWeight: "900",
  color: "#64748b",
  marginBottom: "8px",
  letterSpacing: "1px",
};

const select = {
  width: "100%",
  height: "46px",
  borderRadius: "14px",
  border: "1px solid #dbe3ed",
  background: "#f8fafc",
  padding: "0 14px",
  fontSize: "14px",
  fontWeight: "700",
  outline: "none",
};

const emptyBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "28px",
  color: "#64748b",
  fontWeight: "900",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const card = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const cardLabel = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "900",
  marginBottom: "8px",
};

const cardValue = {
  fontSize: "22px",
  color: "#0f172a",
  fontWeight: "900",
  textTransform: "capitalize",
};

const twoColumn = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
  marginBottom: "22px",
};

const panel = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  marginBottom: "22px",
};

const panelTitle = {
  margin: "0 0 16px",
  fontSize: "20px",
  fontWeight: "900",
  color: "#0b4aa2",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "12px 0",
  borderBottom: "1px solid #edf2f7",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "800",
};

const infoValue = {
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "900",
  textTransform: "capitalize",
  textAlign: "right",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "13px",
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "900",
  borderBottom: "1px solid #e5e7eb",
  letterSpacing: "1px",
};

const td = {
  padding: "13px",
  fontSize: "13px",
  borderBottom: "1px solid #edf2f7",
}; 