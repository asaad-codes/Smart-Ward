const mongoose = require("mongoose");
const wardModel = require("../models/ward.model");

const createWard = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can create wards.",
            });
        }

        const { name, type, capacity, occupied, floor, status } = req.body;

        if (!name || !type || capacity === undefined || !floor) {
            return res.status(400).json({
                success: false,
                message: "Ward name, type, capacity, and floor are required",
            });
        }

        if (Number(capacity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Ward capacity must be greater than 0",
            });
        }

        if (occupied !== undefined && Number(occupied) < 0) {
            return res.status(400).json({
                success: false,
                message: "Occupied beds cannot be negative",
            });
        }

        if (occupied !== undefined && Number(occupied) > Number(capacity)) {
            return res.status(400).json({
                success: false,
                message: "Occupied beds cannot be greater than capacity",
            });
        }

        const ward = await wardModel.create({
            name: String(name).trim(),
            type: String(type).trim(),
            capacity: Number(capacity),
            occupied: Number(occupied || 0),
            floor: String(floor).trim(),
            status: status || "ACTIVE",
            createdBy: req.user.id,
        });

        const populatedWard = await wardModel
            .findById(ward._id)
            .populate("createdBy", "name email role");

        return res.status(201).json({
            success: true,
            message: "Ward created successfully",
            data: populatedWard,
        });
    } catch (error) {
        console.error("Backend Create Ward Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error while creating ward.",
        });
    }
};

const getWards = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view wards.",
            });
        }

        const wards = await wardModel
            .find()
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Wards fetched successfully",
            data: wards,
        });
    } catch (error) {
        console.error("Backend Get Wards Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error while fetching wards.",
        });
    }
};

const updateWard = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update wards.",
            });
        }

        const wardId = req.params.id.trim();
        const { name, type, capacity, occupied, floor, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(wardId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ward ID",
            });
        }

        const existingWard = await wardModel.findById(wardId);

        if (!existingWard) {
            return res.status(404).json({
                success: false,
                message: "Ward not found",
            });
        }

        const updatedData = {};

        if (name !== undefined) updatedData.name = String(name).trim();
        if (type !== undefined) updatedData.type = String(type).trim();
        if (floor !== undefined) updatedData.floor = String(floor).trim();
        if (status !== undefined) updatedData.status = status;

        if (capacity !== undefined) {
            if (Number(capacity) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Ward capacity must be greater than 0",
                });
            }

            updatedData.capacity = Number(capacity);
        }

        if (occupied !== undefined) {
            if (Number(occupied) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Occupied beds cannot be negative",
                });
            }

            updatedData.occupied = Number(occupied);
        }

        const finalCapacity =
            updatedData.capacity !== undefined
                ? updatedData.capacity
                : existingWard.capacity;

        const finalOccupied =
            updatedData.occupied !== undefined
                ? updatedData.occupied
                : existingWard.occupied;

        if (finalOccupied > finalCapacity) {
            return res.status(400).json({
                success: false,
                message: "Occupied beds cannot be greater than capacity",
            });
        }

        const ward = await wardModel
            .findByIdAndUpdate(wardId, updatedData, {
                new: true,
                runValidators: true,
            })
            .populate("createdBy", "name email role");

        return res.status(200).json({
            success: true,
            message: "Ward updated successfully",
            data: ward,
        });
    } catch (error) {
        console.error("Backend Update Ward Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error while updating ward.",
        });
    }
};

const deleteWard = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete wards.",
            });
        }

        const wardId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(wardId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ward ID",
            });
        }

        const ward = await wardModel.findByIdAndDelete(wardId);

        if (!ward) {
            return res.status(404).json({
                success: false,
                message: "Ward not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ward deleted successfully",
        });
    } catch (error) {
        console.error("Backend Delete Ward Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error while deleting ward.",
        });
    }
};

module.exports = {
    createWard,
    getWards,
    updateWard,
    deleteWard,
};