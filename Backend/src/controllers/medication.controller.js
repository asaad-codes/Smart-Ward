const mongoose = require("mongoose");
const medicationModel = require("../models/medication.model");
const patientModel = require("../models/patient.model");

function getSectionByTime(time) {
    if (time === "08:00") return "morning";
    if (time === "18:00") return "evening";
    return "noon";
}

function getStatusByTime(time) {
    if (time === "18:00") return "SCHEDULED";
    return "DUE NOW";
}

const createMedication = async (req, res) => {
    try {
        const { time, name, dose, patient, location, tag } = req.body;

        if (!time || !name || !dose || !patient || !location) {
            return res.status(400).json({
                success: false,
                message: "Time, medication name, dose, patient, and location are required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(patient)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID.",
            });
        }

        const existingPatient = await patientModel.findById(patient);

        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found.",
            });
        }

        const medication = await medicationModel.create({
            time: String(time).trim(),
            name: String(name).trim(),
            dose: String(dose).trim(),
            patient,
            location: String(location).trim(),
            tag: tag || "ROUTINE",
            status: getStatusByTime(time),
            section: getSectionByTime(time),
            completed: false,
            createdBy: req.user.id,
        });

        const populatedMedication = await medicationModel
            .findById(medication._id)
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role");

        return res.status(201).json({
            success: true,
            message: "Medication added successfully",
            data: populatedMedication,
        });
    } catch (error) {
        console.error("Backend Create Medication Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while creating medication.",
        });
    }
};

const getMedications = async (req, res) => {
    try {
        const medications = await medicationModel
            .find()
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Medications fetched successfully",
            data: medications,
        });
    } catch (error) {
        console.error("Backend Get Medications Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching medications.",
        });
    }
};

const getMyMedications = async (req, res) => {
    try {
        const patientRecord = await patientModel.findOne({
            user: req.user.id,
        });

        if (!patientRecord) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found for this account.",
            });
        }

        const medications = await medicationModel
            .find({
                patient: patientRecord._id,
            })
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Your medications fetched successfully",
            data: medications,
        });
    } catch (error) {
        console.error("Backend Get My Medications Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching your medications.",
        });
    }
};

const updateMedication = async (req, res) => {
    try {
        const medicationId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medication ID.",
            });
        }

        const {
            time,
            name,
            dose,
            patient,
            location,
            tag,
            status,
            completed,
        } = req.body;

        const updateData = {};

        if (time !== undefined) {
            updateData.time = String(time).trim();
            updateData.section = getSectionByTime(time);
        }

        if (name !== undefined) updateData.name = String(name).trim();
        if (dose !== undefined) updateData.dose = String(dose).trim();

        if (patient !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(patient)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid patient ID.",
                });
            }

            const existingPatient = await patientModel.findById(patient);

            if (!existingPatient) {
                return res.status(404).json({
                    success: false,
                    message: "Patient record not found.",
                });
            }

            updateData.patient = patient;
        }

        if (location !== undefined) updateData.location = String(location).trim();
        if (tag !== undefined) updateData.tag = tag;
        if (status !== undefined) updateData.status = status;
        if (completed !== undefined) updateData.completed = completed;

        const medication = await medicationModel
            .findByIdAndUpdate(medicationId, updateData, {
                new: true,
                runValidators: true,
            })
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role");

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: "Medication not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Medication updated successfully",
            data: medication,
        });
    } catch (error) {
        console.error("Backend Update Medication Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while updating medication.",
        });
    }
};

const markMedicationGiven = async (req, res) => {
    try {
        const medicationId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medication ID.",
            });
        }

        const medication = await medicationModel
            .findByIdAndUpdate(
                medicationId,
                {
                    completed: true,
                    status: "ADMINISTERED",
                    actionReason: "",
                },
                {
                    new: true,
                    runValidators: true,
                }
            )
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role");

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: "Medication not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Medication marked as given",
            data: medication,
        });
    } catch (error) {
        console.error("Backend Mark Medication Given Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while marking medication as given.",
        });
    }
};

const markMedicationMissed = async (req, res) => {
    try {
        const medicationId = req.params.id.trim();
        const { actionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medication ID.",
            });
        }

        if (!actionReason || !String(actionReason).trim()) {
            return res.status(400).json({
                success: false,
                message: "Action reason is required.",
            });
        }

        const medication = await medicationModel
            .findByIdAndUpdate(
                medicationId,
                {
                    completed: false,
                    status: "MISSED",
                    actionReason: String(actionReason).trim(),
                },
                {
                    new: true,
                    runValidators: true,
                }
            )
            .populate("patient", "name age disease ward bed gender status")
            .populate("createdBy", "name email role");

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: "Medication not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Missed medication action recorded",
            data: medication,
        });
    } catch (error) {
        console.error("Backend Mark Medication Missed Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while recording missed medication.",
        });
    }
};

const deleteMedication = async (req, res) => {
    try {
        const medicationId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medication ID.",
            });
        }

        const medication = await medicationModel.findByIdAndDelete(medicationId);

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: "Medication not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Medication deleted successfully",
        });
    } catch (error) {
        console.error("Backend Delete Medication Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while deleting medication.",
        });
    }
};

module.exports = {
    createMedication,
    getMedications,
    getMyMedications,
    updateMedication,
    markMedicationGiven,
    markMedicationMissed,
    deleteMedication,
};  