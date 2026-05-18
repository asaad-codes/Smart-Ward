const wardModel = require('../models/ward.model');
const userModel = require('../models/user.model');

const createWard = async (req, res) => {
    try {
        const { wardName, wardType, capacity, floor } = req.body;

        const newWard = new wardModel({
            wardName,
            wardType,
            capacity,
            floor,
            managedBy: req.user.id  
        });

        const savedWard = await newWard.save();
        
        // FIXED: Corrected the syntax for the JSON response
        res.status(201).json({
            message: "Ward created successfully",
            data: savedWard
        });
    } catch (error) {
        console.error("Backend Create Ward Error:", error);
        res.status(500).json({
            message: "Internal server error occurred while creating ward."
        });
    }
}; // FIXED: Properly closed createWard here

const getWards = async (req, res) => {
    try {
        const wards = await wardModel.find().populate("managedBy", "name email"); 
        res.status(200).json({
            message: "Wards fetched successfully",
            data: wards
        });
    } catch (error) {
        console.error("Backend Get Wards Error:", error);
        res.status(500).json({
            message: "Internal server error occurred while fetching wards."
        });
    } 
};

// Get a single ward by ID
const getSingleWard = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the ward and populate the user details who manages it
        const ward = await wardModel.findById(id).populate("managedBy", "name email");

        if (!ward) {
            return res.status(404).json({
                message: "Ward not found."
            });
        }

        res.status(200).json({
            message: "Ward fetched successfully",
            data: ward
        });
    } catch (error) {
        console.error("Backend Get Single Ward Error:", error);
        res.status(500).json({
            message: "Internal server error occurred while fetching the ward."
        });
    }
};

// Update an existing ward by ID
const updateWard = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the ward and update it with the incoming request body data.
        // runValidators: true ensures that updated strings still match your enum rules ("icu", "general", etc.)
        const updatedWard = await wardModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true } 
        ).populate("managedBy", "name email");

        if (!updatedWard) {
            return res.status(404).json({
                message: "Ward not found or could not be updated."
            });
        }

        res.status(200).json({
            message: "Ward updated successfully",
            data: updatedWard
        });
    } catch (error) {
        console.error("Backend Update Ward Error:", error);
        
        // Handle Mongoose validation errors during update (e.g. invalid enum values)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation failed. Please check your fields and enum values.",
                error: error.message
            });
        }

        res.status(500).json({
            message: "Internal server error occurred while updating the ward."
        });
    }
}; 

// FIXED: Exported the functions so your router can access them
module.exports = {
    createWard,
    getWards,
    getSingleWard,
    updateWard
};  