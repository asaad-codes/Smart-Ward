const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            required: true,
            trim: true,
        },

        capacity: {
            type: Number,
            required: true,
            min: 1,
        },

        occupied: {
            type: Number,
            default: 0,
            min: 0,
        },

        floor: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["AVAILABLE", "NEAR CAPACITY", "FULL", "CRITICAL", "MAINTENANCE"],
            default: "AVAILABLE",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const wardModel = mongoose.model("Ward", wardSchema);

module.exports = wardModel; 