"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { getItem, setItem } from "../../../lib/storage";

const STORAGE_KEY = "smartward_patients";

const fallbackPatients = [
  {
    id: "12345",
    name: "John Doe",
    age: 65,
    sex: "Male",
    ward: "A",
    bed: "12",
    admission: "Oct 24, 2023",
    doctor: "Dr. Sarah Chen",
    status: "STABLE",
    initials: "JD",
    vitals: {
      pulse: 72,
      spo2: 98,
      bp: "120/80",
      temp: "36.8",
    },
    medications: [
      {
        id: "med-1",
        name: "Lisinopril 10mg",
        desc: "1 Tablet • Hypertension",
        time: "09:00 AM",
        status: "DUE NOW",
      },
      {
        id: "med-2",
        name: "Atorvastatin 20mg",
        desc: "1 Tablet • Cholesterol",
        time: "08:00 PM",
        status: "PENDING",
      },
    ],
    notes: [
      {
        id: "note-1",
        author: "RN MILLER",
        time: "TODAY, 06:15 AM",
        text: "Patient reports slight dizziness after morning medication. BP remains within parameters. Monitoring closely.",
      },
      {
        id: "note-2",
        author: "DR. CHEN",
        time: "OCT 25, 10:40 PM",
        text: "Stable recovery post-admission. Will reassess medication dosage tomorrow morning.",
      },
    ],
    caseHistory: [
      {
        id: "case-1",
        title: "Admission recorded",
        desc: "Patient admitted for observation and vitals monitoring.",
      },
      {
        id: "case-2",
        title: "Medication review",
        desc: "Clinical team reviewed current medication schedule.",
      },
      {
        id: "case-3",
        title: "Recovery observation",
        desc: "Vitals remained stable across monitoring intervals.",
      },
    ],
    labResults: [
      { id: "lab-1", label: "Potassium", value: "3.2 mEq/L", status: "Low" },
      { id: "lab-2", label: "Sodium", value: "138 mEq/L", status: "Normal" },
      { id: "lab-3", label: "Fasting Glucose", value: "Pending", status: "Review" },
    ],
  },
];

function getInitials(name = "John Doe") {
  const words = String(name || "John Doe").trim().split(/\s+/);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return words[0]?.slice(0, 2).toUpperCase() || "JD";
}

function ensurePatients(data) {
  if (!Array.isArray(data) || data.length === 0) return fallbackPatients;

  return data.map((item, patientIndex) => {
    const name = item?.name || fallbackPatients[0].name;

    return {
      ...fallbackPatients[0],
      ...item,
      id: String(item?.id || fallbackPatients[0].id),
      name,
      initials: item?.initials || getInitials(name),
      age: item?.age || fallbackPatients[0].age,
      sex: item?.sex || fallbackPatients[0].sex,
      ward: item?.ward || fallbackPatients[0].ward,
      bed: item?.bed || fallbackPatients[0].bed,
      admission: item?.admission || fallbackPatients[0].admission,
      doctor: item?.doctor || fallbackPatients[0].doctor,
      status: item?.status || fallbackPatients[0].status,
      vitals: {
        ...fallbackPatients[0].vitals,
        ...(item?.vitals || {}),
      },
      medications:
        Array.isArray(item?.medications) && item.medications.length
          ? item.medications.map((med, medIndex) => ({
              ...med,
              id: med.id || `med-${patientIndex}-${medIndex}`,
            }))
          : fallbackPatients[0].medications,
      notes:
        Array.isArray(item?.notes) && item.notes.length
          ? item.notes.map((note, noteIndex) => ({
              ...note,
              id: note.id || `note-${patientIndex}-${noteIndex}`,
            }))
          : fallbackPatients[0].notes,
      caseHistory:
        Array.isArray(item?.caseHistory) && item.caseHistory.length
          ? item.caseHistory.map((caseItem, caseIndex) => ({
              ...caseItem,
              id: caseItem.id || `case-${patientIndex}-${caseIndex}`,
            }))
          : fallbackPatients[0].caseHistory,
      labResults:
        Array.isArray(item?.labResults) && item.labResults.length
          ? item.labResults.map((lab, labIndex) => ({
              ...lab,
              id: lab.id || `lab-${patientIndex}-${labIndex}`,
            }))
          : fallbackPatients[0].labResults,
    };
  });
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

function labStatusColors(status) {
  const value = String(status || "").toLowerCase();

  if (value === "normal") {
    return { bg: "#dcfce7", text: "#047857" };
  }

  if (value === "review") {
    return { bg: "#fef3c7", text: "#92400e" };
  }

  return { bg: "#fee2e2", text: "#b91c1c" };
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [isMounted, setIsMounted] = useState(false);
  const [patients, setPatients] = useState(fallbackPatients);
  const [topTab, setTopTab] = useState("clinical");
  const [clinicalTab, setClinicalTab] = useState("vitals");
  const [labConfirmed, setLabConfirmed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    sex: "Male",
    ward: "",
    bed: "",
    admission: "",
    doctor: "",
    status: "STABLE",
    pulse: "",
    spo2: "",
    bp: "",
    temp: "",
  });

  useEffect(() => {
    const stored = getItem(STORAGE_KEY, fallbackPatients);
    setPatients(ensurePatients(stored));
    setIsMounted(true);
  }, []);

  const patient =
    patients.find((item) => String(item.id) === String(params.id)) ||
    fallbackPatients[0];

  const patientStatus = statusColors(patient.status);

  const pulseStatusText = useMemo(() => {
    const pulse = Number(patient?.vitals?.pulse || 72);

    if (pulse >= 110) return "HIGH RANGE";
    if (pulse <= 55) return "LOW RANGE";
    return "NORMAL RANGE";
  }, [patient?.vitals?.pulse]);

  const persistPatients = (updated) => {
    setPatients(updated);
    setItem(STORAGE_KEY, updated);
  };

  const openEditModal = () => {
    setEditForm({
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      ward: patient.ward,
      bed: patient.bed,
      admission: patient.admission,
      doctor: patient.doctor,
      status: patient.status,
      pulse: patient.vitals.pulse,
      spo2: patient.vitals.spo2,
      bp: patient.vitals.bp,
      temp: patient.vitals.temp,
    });

    setShowEditModal(true);
  };

  const saveEditChart = () => {
    if (!editForm.name || !editForm.age || !editForm.ward || !editForm.bed) {
      toast.error("Please fill required patient fields.");
      return;
    }

    const updatedList = patients.map((item) => {
      if (String(item.id) !== String(patient.id)) return item;

      return {
        ...item,
        name: editForm.name,
        age: editForm.age,
        sex: editForm.sex,
        ward: editForm.ward,
        bed: editForm.bed,
        admission: editForm.admission,
        doctor: editForm.doctor,
        status: editForm.status,
        initials: getInitials(editForm.name),
        vitals: {
          ...item.vitals,
          pulse: editForm.pulse,
          spo2: editForm.spo2,
          bp: editForm.bp,
          temp: editForm.temp,
        },
      };
    });

    persistPatients(updatedList);
    setShowEditModal(false);
    toast.success("Patient chart updated.");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Patient link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleConfirmLab = () => {
    setLabConfirmed(true);
    toast.success("Lab request confirmed.");
  };

  const addNote = () => {
    if (!noteText.trim()) {
      toast.error("Please write a note first.");
      return;
    }

    const newNote = {
      id: `note-${Date.now()}`,
      author: "DR. CHEN",
      time: "JUST NOW",
      text: noteText.trim(),
    };

    const updatedList = patients.map((item) => {
      if (String(item.id) !== String(patient.id)) return item;

      return {
        ...item,
        notes: [newNote, ...(item.notes || [])],
      };
    });

    persistPatients(updatedList);
    setNoteText("");
    setShowNoteModal(false);
    setTopTab("clinical");
    setClinicalTab("notes");
    toast.success("Clinical note added.");
  };

  const deleteNote = (noteId) => {
    const updatedList = patients.map((item) => {
      if (String(item.id) !== String(patient.id)) return item;

      return {
        ...item,
        notes: (item.notes || []).filter((note) => note.id !== noteId),
      };
    });

    persistPatients(updatedList);
    toast.success("Note deleted.");
  };

  if (!isMounted) {
    return (
      <AppShell>
        <div style={loadingPage}>
          <div style={loadingCard}>
            <div style={loadingIcon}>🏥</div>
            <div style={loadingTitle}>Loading Patient Profile...</div>
            <div style={loadingText}>Preparing SmartWard clinical view</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={pageWrap}>
        <div style={topBar}>
          <div style={topLeft}>
            <button
              type="button"
              onClick={() => router.push("/patients")}
              style={backButton}
            >
              ←
            </button>

            <div style={headerDivider} />

            <h1 style={headerTitle}>Patient Detail</h1>
          </div>

          <div style={topRight}>
            <TopTabButton
              active={topTab === "clinical"}
              onClick={() => setTopTab("clinical")}
            >
              Clinical View
            </TopTabButton>

            <TopTabButton
              active={topTab === "case"}
              onClick={() => setTopTab("case")}
            >
              Case History
            </TopTabButton>

            <TopTabButton
              active={topTab === "lab"}
              onClick={() => setTopTab("lab")}
            >
              Lab Results
            </TopTabButton>

            <button
              type="button"
              style={smallIconButton}
              onClick={() => toast.success("Notifications opened.")}
            >
              🔔
            </button>

            <button
              type="button"
              style={avatarButton}
              onClick={() => toast.success("Doctor profile opened.")}
            >
              👨‍⚕️
            </button>
          </div>
        </div>

        <div style={contentGrid}>
          <div style={leftArea}>
            <div style={profileCard}>
              <div style={profileAvatarSection}>
                <div style={avatarCard}>{patient.initials}</div>

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

              <div style={profileInfoSection}>
                <div style={profileTopRow}>
                  <div style={profileTextArea}>
                    <h2 style={patientName}>{patient.name}</h2>
                    <p style={patientMeta}>
                      {patient.sex}, {patient.age} years • ID: #{patient.id}
                    </p>
                  </div>

                  <div style={profileActionButtons}>
                    <button
                      type="button"
                      style={editChartBtn}
                      onClick={openEditModal}
                    >
                      ✎ Edit Chart
                    </button>

                    <button
                      type="button"
                      style={shareCircleBtn}
                      onClick={handleShare}
                    >
                      ↗
                    </button>
                  </div>
                </div>

                <div style={profileInfoGrid}>
                  <InfoItem label="WARD" value={patient.ward} />
                  <InfoItem label="BED" value={patient.bed} />
                  <InfoItem label="ADMISSION" value={patient.admission} />
                  <InfoItem label="ATTENDING" value={patient.doctor} />
                </div>
              </div>
            </div>

            {topTab === "clinical" && (
              <>
                <div style={subTabsWrap}>
                  <SubTabButton
                    active={clinicalTab === "vitals"}
                    onClick={() => setClinicalTab("vitals")}
                  >
                    Vitals History
                  </SubTabButton>

                  <SubTabButton
                    active={clinicalTab === "medications"}
                    onClick={() => setClinicalTab("medications")}
                  >
                    Medication Schedule
                  </SubTabButton>

                  <SubTabButton
                    active={clinicalTab === "notes"}
                    onClick={() => setClinicalTab("notes")}
                  >
                    Clinical Notes
                  </SubTabButton>
                </div>

                {clinicalTab === "vitals" && (
                  <>
                    <div style={statsCardGrid}>
                      <div style={boxCard}>
                        <div style={boxCardTop}>
                          <h3 style={boxTitle}>Blood Pressure</h3>
                          <span style={mutedLabel}>LAST 24H</span>
                        </div>

                        <div style={bpBars}>
                          {[58, 74, 70, 86, 64, 80].map((height, index) => (
                            <div
                              key={index}
                              style={{
                                ...bpBar,
                                height: `${height}%`,
                                background:
                                  index === 3 ? "#0b4aa2" : "#e9eef5",
                              }}
                            />
                          ))}
                        </div>

                        <div style={bpBottom}>
                          <div style={bpValue}>{patient.vitals.bp}</div>
                          <span style={goodBadge}>Optimal</span>
                        </div>
                      </div>

                      <div style={boxCard}>
                        <div style={boxCardTop}>
                          <h3 style={boxTitle}>SpO2</h3>
                          <span style={mutedLabel}>CONTINUOUS</span>
                        </div>

                        <div style={spo2Area}>
                          <div style={spo2Wave} />
                          <div style={spo2BigText}>
                            {patient.vitals.spo2}
                            <span style={spo2Percent}>%</span>
                          </div>
                          <div style={spo2Dot} />
                        </div>

                        <div style={spo2BottomRow}>
                          <span style={mutedLabel}>OXYGEN SATURATION</span>
                          <span style={{ color: "#047857", fontWeight: 800 }}>
                            ●
                          </span>
                        </div>
                      </div>
                    </div>

                    <MedicationPreview patient={patient} router={router} />
                  </>
                )}

                {clinicalTab === "medications" && (
                  <div style={simpleCard}>
                    <div style={upcomingTop}>
                      <h3 style={upcomingTitle}>Medication Schedule</h3>

                      <button
                        type="button"
                        onClick={() => router.push("/medications")}
                        style={viewScheduleBtn}
                      >
                        Open Medication Page
                      </button>
                    </div>

                    {(patient.medications || []).map((med) => (
                      <MedicationRow key={med.id} med={med} />
                    ))}
                  </div>
                )}

                {clinicalTab === "notes" && (
                  <div style={simpleCard}>
                    <div style={notesHeader}>
                      <h3 style={notesHeading}>Clinical Notes</h3>

                      <button
                        type="button"
                        onClick={() => setShowNoteModal(true)}
                        style={addNoteBtn}
                      >
                        + Add Note
                      </button>
                    </div>

                    {(patient.notes || []).length ? (
                      patient.notes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onDelete={() => deleteNote(note.id)}
                        />
                      ))
                    ) : (
                      <p style={emptyStateText}>No notes available.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {topTab === "case" && (
              <div style={simpleCard}>
                <h3 style={notesHeading}>Case History</h3>

                {(patient.caseHistory || []).map((item) => (
                  <div key={item.id} style={timelineRow}>
                    <div style={timelineDot} />
                    <div>
                      <div style={timelineTitle}>{item.title}</div>
                      <div style={timelineDesc}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topTab === "lab" && (
              <div style={simpleCard}>
                <h3 style={notesHeading}>Lab Results</h3>

                {(patient.labResults || []).map((lab) => {
                  const color = labStatusColors(lab.status);

                  return (
                    <div key={lab.id} style={labRow}>
                      <div style={labLabel}>{lab.label}</div>
                      <div style={labValue}>{lab.value}</div>
                      <span
                        style={{
                          ...labStatusPill,
                          background: color.bg,
                          color: color.text,
                        }}
                      >
                        {lab.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={rightArea}>
            <div style={pulseCard}>
              <div style={pulseHeaderRow}>
                <div>
                  <div style={pulseLabel}>REAL-TIME PULSE</div>
                  <div style={pulseValue}>{patient.vitals.pulse}</div>
                </div>

                <div style={pulseHeart}>♥</div>
              </div>

              <div style={pulseSub}>Beats per minute</div>

              <div style={pulseStatusBar}>STATUS: {pulseStatusText} →</div>
            </div>

            <div
              style={{
                ...alertCard,
                background: labConfirmed ? "#dcfce7" : "#ffe3de",
                border: labConfirmed
                  ? "1px solid #bbf7d0"
                  : "1px solid #fecaca",
              }}
            >
              <div
                style={{
                  ...alertTitle,
                  color: labConfirmed ? "#047857" : "#b91c1c",
                }}
              >
                {labConfirmed ? "✅ LAB REQUEST CONFIRMED" : "⚠ ACTION REQUIRED"}
              </div>

              <div
                style={{
                  ...alertText,
                  color: labConfirmed ? "#047857" : "#991b1b",
                }}
              >
                {labConfirmed
                  ? "Scheduled blood work request has been confirmed successfully."
                  : "Scheduled blood work for fasting glucose is pending. Lab technician notified at 07:45 AM."}
              </div>

              <button
                type="button"
                onClick={handleConfirmLab}
                style={{
                  ...confirmBtn,
                  background: labConfirmed ? "#047857" : "#d91421",
                }}
              >
                {labConfirmed ? "Lab Request Confirmed" : "Confirm Lab Request"}
              </button>
            </div>

            <div style={recentNotesCard}>
              <div style={notesHeader}>
                <h3 style={notesHeading}>Recent Notes</h3>

                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  style={miniAddButton}
                >
                  +
                </button>
              </div>

              {(patient.notes || []).length ? (
                patient.notes.slice(0, 2).map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    compact
                    onDelete={() => deleteNote(note.id)}
                  />
                ))
              ) : (
                <p style={emptyStateText}>No recent notes available.</p>
              )}
            </div>

            <div style={tempCard}>
              <div style={tempTitle}>TEMPERATURE</div>

              <div style={tempMainRow}>
                <div style={temperatureNumber}>{patient.vitals.temp}°C</div>
                <span style={tempBadge}>Afebrile</span>
              </div>
            </div>
          </div>
        </div>

        {showEditModal && (
          <Modal
            title="Edit Patient Chart"
            onClose={() => setShowEditModal(false)}
          >
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

              <SelectField
                label="Sex"
                value={editForm.sex}
                onChange={(value) => setEditForm({ ...editForm, sex: value })}
                options={["Male", "Female"]}
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

              <InputField
                label="Admission"
                value={editForm.admission}
                onChange={(value) =>
                  setEditForm({ ...editForm, admission: value })
                }
              />

              <InputField
                label="Doctor"
                value={editForm.doctor}
                onChange={(value) => setEditForm({ ...editForm, doctor: value })}
              />

              <SelectField
                label="Status"
                value={editForm.status}
                onChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
                options={["STABLE", "OBSERVATION", "CRITICAL"]}
              />

              <InputField
                label="Pulse"
                value={editForm.pulse}
                onChange={(value) => setEditForm({ ...editForm, pulse: value })}
              />

              <InputField
                label="SpO2"
                value={editForm.spo2}
                onChange={(value) => setEditForm({ ...editForm, spo2: value })}
              />

              <InputField
                label="Blood Pressure"
                value={editForm.bp}
                onChange={(value) => setEditForm({ ...editForm, bp: value })}
              />

              <InputField
                label="Temperature"
                value={editForm.temp}
                onChange={(value) => setEditForm({ ...editForm, temp: value })}
              />
            </div>

            <div style={modalActions}>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={cancelBtn}
              >
                Cancel
              </button>

              <button type="button" onClick={saveEditChart} style={saveBtn}>
                Save Changes
              </button>
            </div>
          </Modal>
        )}

        {showNoteModal && (
          <Modal title="Add Clinical Note" onClose={() => setShowNoteModal(false)}>
            <label style={fieldLabel}>Clinical Note</label>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write note here..."
              style={textArea}
            />

            <div style={modalActions}>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                style={cancelBtn}
              >
                Cancel
              </button>

              <button type="button" onClick={addNote} style={saveBtn}>
                Add Note
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function MedicationPreview({ patient, router }) {
  return (
    <div style={upcomingWrap}>
      <div style={upcomingTop}>
        <h3 style={upcomingTitle}>Upcoming Medications</h3>

        <button
          type="button"
          onClick={() => router.push("/medications")}
          style={viewScheduleBtn}
        >
          View Full Schedule 🗓
        </button>
      </div>

      {(patient.medications || []).map((med) => (
        <MedicationRow key={med.id} med={med} />
      ))}
    </div>
  );
}

function MedicationRow({ med }) {
  return (
    <div style={medCard}>
      <div
        style={{
          ...medIcon,
          background: med.status === "DUE NOW" ? "#dbeafe" : "#eef2f7",
        }}
      >
        💊
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={medTitle}>{med.name}</div>
        <div style={medDesc}>{med.desc}</div>
      </div>

      <div style={medTimeBox}>
        <div style={medTime}>{med.time}</div>
        <div style={medStatus}>{med.status}</div>
      </div>
    </div>
  );
}

function TopTabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "18px 0 16px",
        borderBottom: active ? "3px solid #0b4aa2" : "3px solid transparent",
        color: active ? "#0b4aa2" : "#64748b",
        fontWeight: active ? 800 : 700,
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SubTabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "0 0 14px",
        borderBottom: active ? "3px solid #0b4aa2" : "3px solid transparent",
        color: active ? "#0b4aa2" : "#94a3b8",
        fontWeight: 800,
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

function NoteCard({ note, onDelete, compact = false }) {
  return (
    <div style={{ ...noteCard, padding: compact ? 16 : 18 }}>
      <div style={noteMetaRow}>
        <span>{note.time}</span>
        <span>{note.author}</span>
      </div>

      <p style={{ ...noteTextStyle, fontSize: compact ? 14 : 15 }}>
        “{note.text}”
      </p>

      <button type="button" onClick={onDelete} style={deleteNoteBtn}>
        Delete Note
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={modalTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={fieldInput}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={fieldInput}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const loadingPage = {
  minHeight: "100vh",
  background: "#f5f8fc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Inter, Arial, sans-serif",
};

const loadingCard = {
  background: "#fff",
  borderRadius: 24,
  padding: 34,
  textAlign: "center",
  boxShadow: "0 20px 45px rgba(15,23,42,0.12)",
  border: "1px solid #e7edf5",
};

const loadingIcon = {
  fontSize: 42,
  marginBottom: 14,
};

const loadingTitle = {
  color: "#0b4aa2",
  fontSize: 22,
  fontWeight: 900,
};

const loadingText = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 14,
};

const pageWrap = {
  minHeight: "100vh",
  background: "#f5f8fc",
  color: "#111827",
  fontFamily: "Inter, Arial, sans-serif",
  overflowX: "hidden",
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
  boxSizing: "border-box",
};

const topLeft = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  minWidth: 230,
};

const topRight = {
  display: "flex",
  alignItems: "center",
  gap: 22,
  overflowX: "auto",
};

const backButton = {
  border: "none",
  background: "transparent",
  fontSize: 28,
  cursor: "pointer",
  color: "#111827",
};

const headerDivider = {
  width: 1,
  height: 30,
  background: "#dbe5f0",
};

const headerTitle = {
  margin: 0,
  color: "#0b4aa2",
  fontWeight: 800,
  fontSize: 20,
  whiteSpace: "nowrap",
};

const smallIconButton = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 20,
};

const avatarButton = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "none",
  background: "#e0ecff",
  fontSize: 20,
  cursor: "pointer",
  flexShrink: 0,
};

const contentGrid = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gridTemplateColumns: "minmax(640px, 1fr) 330px",
  gap: 22,
  alignItems: "start",
  boxSizing: "border-box",
};

const leftArea = {
  minWidth: 0,
};

const rightArea = {
  minWidth: 0,
  display: "grid",
  gap: 18,
};

const profileCard = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 20,
  padding: 24,
  display: "grid",
  gridTemplateColumns: "150px minmax(0, 1fr)",
  gap: 26,
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  marginBottom: 26,
  overflow: "hidden",
};

const profileAvatarSection = {
  position: "relative",
  width: 150,
  height: 150,
};

const avatarCard = {
  width: 150,
  height: 150,
  borderRadius: 18,
  background: "linear-gradient(135deg,#111827,#334155,#0f766e)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 56,
  fontWeight: 900,
};

const statusBadge = {
  position: "absolute",
  right: -10,
  bottom: -10,
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.8,
  boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
};

const profileInfoSection = {
  minWidth: 0,
  width: "100%",
};

const profileTopRow = {
  display: "block",
  width: "100%",
};

const profileTextArea = {
  minWidth: 0,
  width: "100%",
};

const patientName = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.1,
  fontWeight: 900,
  color: "#111827",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "break-word",
  maxWidth: "100%",
};

const patientMeta = {
  margin: "8px 0 0",
  fontSize: 16,
  color: "#64748b",
  lineHeight: 1.5,
  overflowWrap: "break-word",
  maxWidth: "100%",
};

const profileActionButtons = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginTop: 18,
  flexWrap: "wrap",
};

const editChartBtn = {
  height: 54,
  borderRadius: 999,
  border: "none",
  background: "#0b4aa2",
  color: "#fff",
  padding: "0 22px",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(11,74,162,0.22)",
  whiteSpace: "nowrap",
};

const shareCircleBtn = {
  width: 54,
  height: 54,
  borderRadius: "50%",
  border: "none",
  background: "#eef2f7",
  color: "#0f172a",
  fontSize: 20,
  cursor: "pointer",
  flexShrink: 0,
};

const profileInfoGrid = {
  marginTop: 20,
  paddingTop: 16,
  borderTop: "1px solid #edf2f7",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

const subTabsWrap = {
  display: "flex",
  gap: 28,
  alignItems: "center",
  borderBottom: "1px solid #dbe5ef",
  marginBottom: 22,
  overflowX: "auto",
};

const statsCardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 22,
};

const boxCard = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const boxCardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const boxTitle = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
};

const mutedLabel = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
};

const bpBars = {
  height: 110,
  marginTop: 18,
  display: "flex",
  alignItems: "end",
  gap: 8,
};

const bpBar = {
  flex: 1,
  borderRadius: "8px 8px 0 0",
};

const bpBottom = {
  marginTop: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
};

const bpValue = {
  fontSize: 28,
  fontWeight: 900,
  color: "#111827",
};

const goodBadge = {
  background: "#dcfce7",
  color: "#059669",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
};

const spo2Area = {
  position: "relative",
  height: 146,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const spo2Wave = {
  position: "absolute",
  width: "86%",
  height: 52,
  borderBottom: "4px solid #e2e8f0",
  borderRadius: "50%",
  transform: "rotate(-8deg)",
};

const spo2BigText = {
  position: "relative",
  zIndex: 2,
  fontSize: 48,
  fontWeight: 900,
  color: "#111827",
};

const spo2Percent = {
  fontSize: 24,
  marginLeft: 2,
};

const spo2Dot = {
  position: "absolute",
  right: 44,
  top: 80,
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: "#0b4aa2",
  zIndex: 2,
};

const spo2BottomRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const upcomingWrap = {
  background: "#eef3f8",
  borderRadius: 20,
  padding: 24,
};

const upcomingTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
  flexWrap: "wrap",
};

const upcomingTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
};

const viewScheduleBtn = {
  border: "none",
  background: "transparent",
  color: "#0b4aa2",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
};

const medCard = {
  background: "#fff",
  borderRadius: 16,
  padding: "16px 18px",
  display: "grid",
  gridTemplateColumns: "48px minmax(0,1fr) auto",
  gap: 14,
  alignItems: "center",
  marginBottom: 14,
};

const medIcon = {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
};

const medTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
  overflowWrap: "anywhere",
};

const medDesc = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 4,
};

const medTimeBox = {
  textAlign: "right",
};

const medTime = {
  color: "#0b4aa2",
  fontSize: 15,
  fontWeight: 800,
};

const medStatus = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 800,
  marginTop: 4,
};

const simpleCard = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const pulseCard = {
  background: "#0a53b2",
  borderRadius: 20,
  padding: 24,
  color: "#fff",
  boxShadow: "0 16px 28px rgba(10,83,178,0.22)",
};

const pulseHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const pulseLabel = {
  fontSize: 12,
  letterSpacing: 2,
  fontWeight: 800,
  opacity: 0.95,
};

const pulseHeart = {
  fontSize: 26,
  color: "#8be1ff",
};

const pulseValue = {
  fontSize: 72,
  lineHeight: 1,
  fontWeight: 900,
  marginTop: 18,
};

const pulseSub = {
  marginTop: 10,
  fontSize: 15,
  opacity: 0.95,
};

const pulseStatusBar = {
  marginTop: 28,
  paddingTop: 18,
  borderTop: "1px solid rgba(255,255,255,0.2)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1,
};

const alertCard = {
  borderRadius: 18,
  padding: 22,
};

const alertTitle = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 14,
};

const alertText = {
  fontSize: 15,
  lineHeight: 1.7,
  fontWeight: 700,
  marginBottom: 18,
};

const confirmBtn = {
  width: "100%",
  height: 50,
  border: "none",
  borderRadius: 999,
  color: "#fff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 24px rgba(15,23,42,0.12)",
};

const recentNotesCard = {
  background: "#fff",
  border: "1px solid #e7edf5",
  borderRadius: 18,
  padding: 22,
};

const notesHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const notesHeading = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
};

const addNoteBtn = {
  border: "none",
  background: "#eef6ff",
  color: "#0b4aa2",
  fontWeight: 800,
  borderRadius: 999,
  padding: "10px 16px",
  cursor: "pointer",
};

const miniAddButton = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "none",
  background: "#eef6ff",
  color: "#0b4aa2",
  fontSize: 22,
  cursor: "pointer",
};

const noteCard = {
  background: "#f2f6fb",
  borderRadius: 14,
  marginBottom: 14,
};

const noteMetaRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  marginBottom: 10,
};

const noteTextStyle = {
  margin: 0,
  lineHeight: 1.7,
  color: "#334155",
  fontStyle: "italic",
};

const deleteNoteBtn = {
  marginTop: 14,
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const tempCard = {
  background: "#374151",
  color: "#fff",
  borderRadius: 18,
  padding: 22,
};

const tempTitle = {
  fontSize: 12,
  letterSpacing: 1.8,
  fontWeight: 800,
  color: "#d1d5db",
};

const tempMainRow = {
  marginTop: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const temperatureNumber = {
  fontSize: 40,
  fontWeight: 900,
  lineHeight: 1,
};

const tempBadge = {
  background: "rgba(255,255,255,0.18)",
  color: "#fff",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 800,
};

const emptyStateText = {
  margin: 0,
  color: "#94a3b8",
};

const timelineRow = {
  display: "grid",
  gridTemplateColumns: "16px 1fr",
  gap: 14,
  padding: "14px 0",
  borderBottom: "1px solid #edf2f7",
};

const timelineDot = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#0b4aa2",
  marginTop: 6,
};

const timelineTitle = {
  fontWeight: 800,
  color: "#0b4aa2",
  marginBottom: 4,
};

const timelineDesc = {
  color: "#64748b",
  lineHeight: 1.6,
};

const labRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: 14,
  alignItems: "center",
  padding: "16px 0",
  borderBottom: "1px solid #edf2f7",
};

const labLabel = {
  fontWeight: 800,
  color: "#111827",
};

const labValue = {
  color: "#64748b",
  fontWeight: 700,
};

const labStatusPill = {
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 800,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxWidth: 680,
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  maxHeight: "88vh",
  overflowY: "auto",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

const modalTitle = {
  fontSize: 26,
  fontWeight: 800,
  marginBottom: 20,
  color: "#111827",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: 16,
};

const fieldLabel = {
  display: "block",
  marginBottom: 8,
  color: "#64748b",
  fontSize: 13,
  fontWeight: 800,
};

const fieldInput = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid #dbe5ef",
  background: "#f8fafc",
  padding: "0 14px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};

const textArea = {
  width: "100%",
  minHeight: 150,
  borderRadius: 14,
  border: "1px solid #dbe5ef",
  background: "#f8fafc",
  padding: 14,
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 20,
};

const cancelBtn = {
  height: 48,
  padding: "0 20px",
  borderRadius: 999,
  border: "none",
  background: "#e2e8f0",
  color: "#334155",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const saveBtn = {
  height: 48,
  padding: "0 22px",
  borderRadius: 999,
  border: "none",
  background: "#0b4aa2",
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};