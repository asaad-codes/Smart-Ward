const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
    {
        // This links patient record with user account.
        // Required only when this patient needs to login and see own data.
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            sparse: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        age: {
            type: Number,
            required: true,
        },

        disease: {
            type: String,
            required: true,
            trim: true,
        },

        admittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        ward: {
            type: String,
            required: true,
            trim: true,
        },

        bed: {
            type: String,
            required: true,
            trim: true,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            required: true,
            lowercase: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["STABLE", "OBSERVATION", "CRITICAL"],
            default: "STABLE",
        },
    },
    { timestamps: true }
);

const patientModel = mongoose.model("Patient", patientSchema);

module.exports = patientModel; 