const mongoose = require("mongoose");
const patientmodel = require("../models/patient.model");
const User = require("../models/user.model");

const validatePatientUser = async (patientUserId) => {
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
        return {
            valid: false,
            status: 400,
            message: "Invalid patient user ID",
        };
    }

    const user = await User.findById(patientUserId);

    if (!user) {
        return {
            valid: false,
            status: 404,
            message: "Linked user account not found",
        };
    }

    if (user.role !== "patient") {
        return {
            valid: false,
            status: 400,
            message: "Only a user with patient role can be linked to a patient record",
        };
    }

    return {
        valid: true,
        user,
    };
};

const createPatient = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can create patient records.",
            });
        }

        const { name, age, disease, ward, bed, gender, status, user, userId } =
            req.body;

        if (!name || !age || !disease || !ward || !bed || !gender) {
            return res.status(400).json({
                success: false,
                message: "All patient fields are required",
            });
        }

        const admittedBy = req.user.id;

        const patientData = {
            name: String(name).trim(),
            age: Number(age),
            disease: String(disease).trim(),
            admittedBy,
            ward: String(ward).trim(),
            bed: String(bed).trim(),
            gender: String(gender).toLowerCase().trim(),
            status: status || "STABLE",
        };

        const patientUserId = user || userId;

        if (patientUserId) {
            const validation = await validatePatientUser(patientUserId);

            if (!validation.valid) {
                return res.status(validation.status).json({
                    success: false,
                    message: validation.message,
                });
            }

            patientData.user = patientUserId;
        }

        const patient = await patientmodel.create(patientData);

        const populatedPatient = await patientmodel
            .findById(patient._id)
            .populate("user", "name email role")
            .populate("admittedBy", "name email role");

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            data: populatedPatient,
        });
    } catch (error) {
        console.error("Backend Create Patient Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "This patient user account is already linked with another patient record.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while creating patient.",
        });
    }
};

const getPatients = async (req, res) => {
    try {
        if (req.user.role === "patient") {
            const patient = await patientmodel
                .findOne({ user: req.user.id })
                .populate("user", "name email role")
                .populate("admittedBy", "name email role")
                .sort({ createdAt: -1 });

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: "Patient record not found for this account.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Your patient record fetched successfully",
                data: patient,
            });
        }

        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view patient records.",
            });
        }

        const patients = await patientmodel
            .find()
            .populate("user", "name email role")
            .populate("admittedBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Patients fetched successfully",
            data: patients,
        });
    } catch (error) {
        console.error("Backend Get Patients Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching patients.",
        });
    }
};

const getMyPatientRecord = async (req, res) => {
    try {
        if (req.user.role !== "patient") {
            return res.status(403).json({
                success: false,
                message: "Only patients can access their own record.",
            });
        }

        const patient = await patientmodel
            .findOne({ user: req.user.id })
            .populate("user", "name email role")
            .populate("admittedBy", "name email role");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found for this account.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient record fetched successfully",
            data: patient,
        });
    } catch (error) {
        console.error("Backend Get My Patient Record Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while fetching patient record.",
        });
    }
};

const updatePatient = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update patient records.",
            });
        }

        const patientId = req.params.id.trim();

        const { name, age, disease, ward, bed, gender, status, user, userId } =
            req.body;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID",
            });
        }

        const existingPatient = await patientmodel.findById(patientId);

        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        const updatedData = {
            admittedBy: req.user.id,
        };

        if (name !== undefined) updatedData.name = String(name).trim();
        if (age !== undefined) updatedData.age = Number(age);
        if (disease !== undefined) updatedData.disease = String(disease).trim();
        if (ward !== undefined) updatedData.ward = String(ward).trim();
        if (bed !== undefined) updatedData.bed = String(bed).trim();
        if (gender !== undefined)
            updatedData.gender = String(gender).toLowerCase().trim();
        if (status !== undefined) updatedData.status = status;

        const patientUserId = user || userId;

        if (patientUserId) {
            const validation = await validatePatientUser(patientUserId);

            if (!validation.valid) {
                return res.status(validation.status).json({
                    success: false,
                    message: validation.message,
                });
            }

            updatedData.user = patientUserId;
        }

        const patient = await patientmodel
            .findByIdAndUpdate(patientId, updatedData, {
                new: true,
                runValidators: true,
            })
            .populate("user", "name email role")
            .populate("admittedBy", "name email role");

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            data: patient,
        });
    } catch (error) {
        console.error("Backend Update Patient Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "This patient user account is already linked with another patient record.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while updating patient.",
        });
    }
};

const deletepatient = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete patient records.",
            });
        }

        const patientId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID",
            });
        }

        const patient = await patientmodel.findByIdAndDelete(patientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient record deleted successfully",
        });
    } catch (error) {
        console.error("Backend Delete Patient Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred while deleting patient.",
        });
    }
};

module.exports = {
    createPatient,
    getPatients,
    getMyPatientRecord,
    updatePatient,
    deletepatient,
}; 