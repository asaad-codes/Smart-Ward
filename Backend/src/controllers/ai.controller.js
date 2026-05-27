const patientModel = require("../models/patient.model");
const wardModel = require("../models/ward.model");
const vitalModel = require("../models/vital.model");
const medicationModel = require("../models/medication.model");

const OUTSIDE_MESSAGE =
    "I can only answer using SmartWard app data. This question is outside available clinical records.";

function cleanText(value) {
    return String(value || "").toLowerCase().trim();
}

function isAppDataQuestion(message) {
    const q = cleanText(message);

    const allowedWords = [
        "patient",
        "patients",
        "ward",
        "wards",
        "bed",
        "beds",
        "medication",
        "medications",
        "medicine",
        "medicines",
        "dose",
        "vital",
        "vitals",
        "bp",
        "blood pressure",
        "heart",
        "pulse",
        "spo2",
        "oxygen",
        "temperature",
        "temp",
        "status",
        "critical",
        "stable",
        "observation",
        "missed",
        "given",
        "administered",
        "scheduled",
        "due",
        "report",
        "summary",
        "dashboard",
        "record",
        "records",
        "disease",
        "condition",
        "doctor",
        "nurse",
        "my",
        "me",
        "details",
    ];

    return allowedWords.some((word) => q.includes(word));
}

function formatPatient(patient) {
    if (!patient) return "No patient record found.";

    return `${patient.name || "Unnamed Patient"} | Age: ${patient.age || "N/A"} | Gender: ${
        patient.gender || "N/A"
    } | Disease: ${patient.disease || "N/A"} | Ward: ${
        patient.ward || "N/A"
    } | Bed: ${patient.bed || "N/A"} | Status: ${patient.status || "N/A"}`;
}

function formatMedication(med) {
    const patientName =
        med.patient && typeof med.patient === "object"
            ? med.patient.name
            : "Unknown Patient";

    return `${med.name || "Unnamed Medication"} | Dose: ${med.dose || "N/A"} | Time: ${
        med.time || "N/A"
    } | Patient: ${patientName} | Location: ${med.location || "N/A"} | Status: ${
        med.status || "N/A"
    }`;
}

function formatVital(vital) {
    const patientName =
        vital.patient && typeof vital.patient === "object"
            ? vital.patient.name
            : "Unknown Patient";

    return `Patient: ${patientName} | BP: ${vital.bp || "N/A"} | HR: ${
        vital.heartRate || "N/A"
    } | Temp: ${vital.temp || "N/A"} | SpO2: ${vital.spo2 || "N/A"}% | Status: ${
        vital.status || "N/A"
    }`;
}

function formatWard(ward) {
    return `${ward.name || "Unnamed Ward"} | Type: ${ward.type || "N/A"} | Floor: ${
        ward.floor || "N/A"
    } | Capacity: ${ward.capacity || 0} | Occupied: ${
        ward.occupied || 0
    } | Status: ${ward.status || "N/A"}`;
}

async function getScopedData(req) {
    const role = req.user.role;

    if (role === "patient") {
        const patient = await patientModel
            .findOne({ user: req.user.id })
            .populate("user", "name email role")
            .populate("admittedBy", "name email role");

        if (!patient) {
            return {
                role,
                patient: null,
                patients: [],
                wards: [],
                medications: [],
                vitals: [],
            };
        }

        const medications = await medicationModel
            .find({ patient: patient._id })
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        const vitals = await vitalModel
            .find({ patient: patient._id })
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role")
            .sort({ createdAt: -1 });

        return {
            role,
            patient,
            patients: [patient],
            wards: [],
            medications,
            vitals,
        };
    }

    if (role === "nurse") {
        const medications = await medicationModel
            .find()
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        const vitals = await vitalModel
            .find()
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role")
            .sort({ createdAt: -1 });

        return {
            role,
            patient: null,
            patients: [],
            wards: [],
            medications,
            vitals,
        };
    }

    if (role === "admin" || role === "doctor") {
        const [patients, wards, medications, vitals] = await Promise.all([
            patientModel
                .find()
                .populate("user", "name email role")
                .populate("admittedBy", "name email role")
                .sort({ createdAt: -1 }),

            wardModel.find().populate("createdBy", "name email role").sort({
                createdAt: -1,
            }),

            medicationModel
                .find()
                .populate("patient", "name age disease ward bed gender status")
                .populate("createdBy", "name email role")
                .sort({ createdAt: -1 }),

            vitalModel
                .find()
                .populate("patient", "name age disease ward bed gender status")
                .populate("recordedBy", "name email role")
                .sort({ createdAt: -1 }),
        ]);

        return {
            role,
            patient: null,
            patients,
            wards,
            medications,
            vitals,
        };
    }

    return {
        role,
        patient: null,
        patients: [],
        wards: [],
        medications: [],
        vitals: [],
    };
}

function buildPatientAnswer(question, data) {
    const q = cleanText(question);
    const patient = data.patient;

    if (!patient) {
        return "No patient record is linked with this account.";
    }

    if (q.includes("medication") || q.includes("medicine") || q.includes("dose")) {
        if (!data.medications.length) {
            return "No medication records are currently assigned to your patient record.";
        }

        return `Your medication records:\n\n${data.medications
            .map((med, index) => `${index + 1}. ${formatMedication(med)}`)
            .join("\n")}`;
    }

    if (
        q.includes("vital") ||
        q.includes("bp") ||
        q.includes("blood pressure") ||
        q.includes("heart") ||
        q.includes("pulse") ||
        q.includes("spo2") ||
        q.includes("oxygen") ||
        q.includes("temp")
    ) {
        if (!data.vitals.length) {
            return "No vital records are currently available for your patient record.";
        }

        return `Your latest vital records:\n\n${data.vitals
            .slice(0, 5)
            .map((vital, index) => `${index + 1}. ${formatVital(vital)}`)
            .join("\n")}`;
    }

    if (q.includes("report")) {
        return "Your report is available in the Reports section. It includes your patient details, medications, and vitals.";
    }

    return `Your patient record:\n\n${formatPatient(patient)}\n\nMedication records: ${data.medications.length}\nVital records: ${data.vitals.length}`;
}

function buildNurseAnswer(question, data) {
    const q = cleanText(question);

    if (
        q.includes("patient") &&
        !q.includes("medication") &&
        !q.includes("medicine") &&
        !q.includes("vital")
    ) {
        return "Nurse access is limited to medication and vital records only.";
    }

    if (q.includes("medication") || q.includes("medicine") || q.includes("missed") || q.includes("due")) {
        const missed = data.medications.filter((med) => med.status === "MISSED").length;
        const administered = data.medications.filter(
            (med) => med.status === "ADMINISTERED"
        ).length;
        const pending = data.medications.filter(
            (med) => med.status !== "ADMINISTERED"
        ).length;

        const latest = data.medications.slice(0, 5);

        return `Medication summary:\n\nTotal medications: ${data.medications.length}\nPending: ${pending}\nAdministered: ${administered}\nMissed: ${missed}\n\nLatest records:\n${latest
            .map((med, index) => `${index + 1}. ${formatMedication(med)}`)
            .join("\n")}`;
    }

    if (
        q.includes("vital") ||
        q.includes("bp") ||
        q.includes("heart") ||
        q.includes("pulse") ||
        q.includes("spo2") ||
        q.includes("temp") ||
        q.includes("critical")
    ) {
        const critical = data.vitals.filter(
            (vital) => vital.status === "CRITICAL"
        ).length;

        const latest = data.vitals.slice(0, 5);

        return `Vital summary:\n\nTotal vital records: ${data.vitals.length}\nCritical vitals: ${critical}\n\nLatest records:\n${latest
            .map((vital, index) => `${index + 1}. ${formatVital(vital)}`)
            .join("\n")}`;
    }

    return "Nurse access allows answers only from medication and vital records.";
}

function buildAdminDoctorAnswer(question, data) {
    const q = cleanText(question);

    if (q.includes("summary") || q.includes("dashboard") || q.includes("overview")) {
        const criticalPatients = data.patients.filter(
            (patient) => patient.status === "CRITICAL"
        ).length;

        const criticalVitals = data.vitals.filter(
            (vital) => vital.status === "CRITICAL"
        ).length;

        const missedMeds = data.medications.filter(
            (med) => med.status === "MISSED"
        ).length;

        return `SmartWard summary:\n\nPatients: ${data.patients.length}\nCritical patients: ${criticalPatients}\nWards: ${data.wards.length}\nMedication records: ${data.medications.length}\nMissed medications: ${missedMeds}\nVital records: ${data.vitals.length}\nCritical vitals: ${criticalVitals}`;
    }

    if (q.includes("critical")) {
        const criticalPatients = data.patients.filter(
            (patient) => patient.status === "CRITICAL"
        );

        const criticalVitals = data.vitals.filter(
            (vital) => vital.status === "CRITICAL"
        );

        if (!criticalPatients.length && !criticalVitals.length) {
            return "No critical patients or critical vital records found in SmartWard data.";
        }

        return `Critical SmartWard records:\n\nCritical patients:\n${
            criticalPatients.length
                ? criticalPatients
                      .map((patient, index) => `${index + 1}. ${formatPatient(patient)}`)
                      .join("\n")
                : "None"
        }\n\nCritical vitals:\n${
            criticalVitals.length
                ? criticalVitals
                      .map((vital, index) => `${index + 1}. ${formatVital(vital)}`)
                      .join("\n")
                : "None"
        }`;
    }

    if (q.includes("patient") || q.includes("patients") || q.includes("disease")) {
        if (!data.patients.length) return "No patient records found.";

        return `Patient records:\n\n${data.patients
            .slice(0, 10)
            .map((patient, index) => `${index + 1}. ${formatPatient(patient)}`)
            .join("\n")}`;
    }

    if (q.includes("ward") || q.includes("bed")) {
        if (!data.wards.length) return "No ward records found.";

        return `Ward records:\n\n${data.wards
            .slice(0, 10)
            .map((ward, index) => `${index + 1}. ${formatWard(ward)}`)
            .join("\n")}`;
    }

    if (q.includes("medication") || q.includes("medicine") || q.includes("missed") || q.includes("due")) {
        if (!data.medications.length) return "No medication records found.";

        const missed = data.medications.filter((med) => med.status === "MISSED").length;
        const administered = data.medications.filter(
            (med) => med.status === "ADMINISTERED"
        ).length;

        return `Medication records:\n\nTotal: ${data.medications.length}\nAdministered: ${administered}\nMissed: ${missed}\n\nLatest:\n${data.medications
            .slice(0, 8)
            .map((med, index) => `${index + 1}. ${formatMedication(med)}`)
            .join("\n")}`;
    }

    if (
        q.includes("vital") ||
        q.includes("bp") ||
        q.includes("blood pressure") ||
        q.includes("heart") ||
        q.includes("pulse") ||
        q.includes("spo2") ||
        q.includes("temp")
    ) {
        if (!data.vitals.length) return "No vital records found.";

        return `Vital records:\n\n${data.vitals
            .slice(0, 8)
            .map((vital, index) => `${index + 1}. ${formatVital(vital)}`)
            .join("\n")}`;
    }

    if (q.includes("report")) {
        return "Reports are available in the Reports section. Admin and doctor can download patient reports with patient details, medications, and vitals.";
    }

    return OUTSIDE_MESSAGE;
}

const askSmartWardAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !String(message).trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required.",
            });
        }

        if (!isAppDataQuestion(message)) {
            return res.status(200).json({
                success: true,
                reply: OUTSIDE_MESSAGE,
            });
        }

        const data = await getScopedData(req);

        let reply = OUTSIDE_MESSAGE;

        if (data.role === "patient") {
            reply = buildPatientAnswer(message, data);
        } else if (data.role === "nurse") {
            reply = buildNurseAnswer(message, data);
        } else if (data.role === "admin" || data.role === "doctor") {
            reply = buildAdminDoctorAnswer(message, data);
        }

        return res.status(200).json({
            success: true,
            reply,
        });
    } catch (error) {
        console.error("Backend AI Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "AI assistant failed to answer.",
        });
    }
};

module.exports = {
    askSmartWardAI,
}; 