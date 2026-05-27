const mongoose = require("mongoose");
const vitalModel = require("../models/vital.model");
const patientModel = require("../models/patient.model");

function calculateStatus(heartRate, temp, spo2) {
    const hr = Number(heartRate);
    const temperature = Number(temp);
    const oxygen = Number(spo2);

    if (hr > 130 || hr < 45 || temperature >= 40 || oxygen < 90) {
        return "CRITICAL";
    }

    if (hr > 100 || temperature >= 38 || oxygen < 94) {
        return "HIGH";
    }

    if (hr < 60) {
        return "LOW";
    }

    return "STABLE";
}

const createVital = async (req, res) => {
    try {
        const { patient, heartRate, bp, temp, spo2, notes } = req.body;

        if (!patient || !heartRate || !bp || !temp || !spo2) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient, heart rate, BP, temperature, and SpO2 are required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(patient)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID.",
            });
        }

        const patientExists = await patientModel.findById(patient);

        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found.",
            });
        }

        if (
            Number(heartRate) <= 0 ||
            Number(temp) <= 0 ||
            Number(spo2) <= 0 ||
            Number(spo2) > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Heart rate, temperature, and SpO2 must be valid numbers.",
            });
        }

        const status = calculateStatus(heartRate, temp, spo2);

        const vital = await vitalModel.create({
            patient,
            heartRate: Number(heartRate),
            bp: String(bp).trim(),
            temp: Number(temp),
            spo2: Number(spo2),
            notes: notes ? String(notes).trim() : "",
            status,
            recordedBy: req.user.id,
        });

        const populatedVital = await vitalModel
            .findById(vital._id)
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role");

        return res.status(201).json({
            success: true,
            message: "Vital record created successfully",
            data: populatedVital,
        });
    } catch (error) {
        console.error("Backend Create Vital Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while creating vital record.",
        });
    }
};

const getVitals = async (req, res) => {
    try {
        const vitals = await vitalModel
            .find()
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Vitals fetched successfully",
            data: vitals,
        });
    } catch (error) {
        console.error("Backend Get Vitals Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching vitals.",
        });
    }
};

const getMyVitals = async (req, res) => {
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

        const vitals = await vitalModel
            .find({
                patient: patientRecord._id,
            })
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Your vitals fetched successfully",
            data: vitals,
        });
    } catch (error) {
        console.error("Backend Get My Vitals Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching your vitals.",
        });
    }
};

const updateVital = async (req, res) => {
    try {
        const vitalId = req.params.id.trim();
        const { patient, heartRate, bp, temp, spo2, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(vitalId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vital ID.",
            });
        }

        const existingVital = await vitalModel.findById(vitalId);

        if (!existingVital) {
            return res.status(404).json({
                success: false,
                message: "Vital record not found.",
            });
        }

        const updateData = {};

        if (patient !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(patient)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid patient ID.",
                });
            }

            const patientExists = await patientModel.findById(patient);

            if (!patientExists) {
                return res.status(404).json({
                    success: false,
                    message: "Patient record not found.",
                });
            }

            updateData.patient = patient;
        }

        if (heartRate !== undefined) {
            if (Number(heartRate) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Heart rate must be a valid number.",
                });
            }

            updateData.heartRate = Number(heartRate);
        }

        if (bp !== undefined) {
            updateData.bp = String(bp).trim();
        }

        if (temp !== undefined) {
            if (Number(temp) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Temperature must be a valid number.",
                });
            }

            updateData.temp = Number(temp);
        }

        if (spo2 !== undefined) {
            if (Number(spo2) <= 0 || Number(spo2) > 100) {
                return res.status(400).json({
                    success: false,
                    message: "SpO2 must be between 1 and 100.",
                });
            }

            updateData.spo2 = Number(spo2);
        }

        if (notes !== undefined) {
            updateData.notes = String(notes).trim();
        }

        const finalHeartRate =
            updateData.heartRate !== undefined
                ? updateData.heartRate
                : existingVital.heartRate;

        const finalTemp =
            updateData.temp !== undefined
                ? updateData.temp
                : existingVital.temp;

        const finalSpo2 =
            updateData.spo2 !== undefined
                ? updateData.spo2
                : existingVital.spo2;

        updateData.status = calculateStatus(finalHeartRate, finalTemp, finalSpo2);

        const vital = await vitalModel
            .findByIdAndUpdate(vitalId, updateData, {
                new: true,
                runValidators: true,
            })
            .populate("patient", "name age disease ward bed gender status")
            .populate("recordedBy", "name email role");

        return res.status(200).json({
            success: true,
            message: "Vital record updated successfully",
            data: vital,
        });
    } catch (error) {
        console.error("Backend Update Vital Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while updating vital record.",
        });
    }
};

const deleteVital = async (req, res) => {
    try {
        const vitalId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(vitalId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vital ID.",
            });
        }

        const vital = await vitalModel.findByIdAndDelete(vitalId);

        if (!vital) {
            return res.status(404).json({
                success: false,
                message: "Vital record not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Vital record deleted successfully",
        });
    } catch (error) {
        console.error("Backend Delete Vital Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while deleting vital record.",
        });
    }
};

module.exports = {
    createVital,
    getVitals,
    getMyVitals,
    updateVital,
    deleteVital,
}; 