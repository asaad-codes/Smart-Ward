const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    wardName: {
        enum : ["general", "icu", "maternity", "emergency", "cardiac", "pediatric", "surgical", "orthopedic", "neurology", "oncology"], 
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    wardType: {
      type: String,
      enum: [
        "general",
        "icu",
        "maternity",
        "emergency",
        "cardiac",
        "pediatric",
        "surgical",
        "orthopedic",
        "neurology",
        "oncology",
      ],
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
    },

    occupiedBeds: {
      type: Number,
      default: 0,
    },

    floor: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "full", "maintenance"],
      default: "available",
    },

    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const wardModel = mongoose.model("Ward", wardSchema);

module.exports = wardModel; 