const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
    {
        time: {
            type: String,
            required: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        dose: {
            type: String,
            required: true,
            trim: true,
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        tag: {
            type: String,
            enum: ["ROUTINE", "STAT ORDER", "PRN"],
            default: "ROUTINE",
        },

        status: {
            type: String,
            enum: ["SCHEDULED", "DUE NOW", "ADMINISTERED", "MISSED"],
            default: "DUE NOW",
        },

        section: {
            type: String,
            enum: ["morning", "noon", "evening"],
            default: "noon",
        },

        completed: {
            type: Boolean,
            default: false,
        },

        actionReason: {
            type: String,
            default: "",
            trim: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const medicationModel = mongoose.model("Medication", medicationSchema);

module.exports = medicationModel; 