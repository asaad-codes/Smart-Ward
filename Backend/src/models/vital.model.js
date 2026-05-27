const mongoose = require("mongoose");

const vitalSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        heartRate: {
            type: Number,
            required: true,
            min: 1,
        },

        bp: {
            type: String,
            required: true,
            trim: true,
        },

        temp: {
            type: Number,
            required: true,
        },

        spo2: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        notes: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: ["STABLE", "HIGH", "LOW", "CRITICAL"],
            default: "STABLE",
        },

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const vitalModel = mongoose.model("Vital", vitalSchema);

module.exports = vitalModel; 