    const patientmodel = require('../models/patient.model');
    const usermodel = require('../models/user.model'); 


    const createPatient = async (req , res) =>{ 

        try {
            const { name , age , disease , ward , gender } = req.body; 

            const admittedBy = req.user.id 

            const patient = await patientmodel.create({ 
                name , age , disease , admittedBy , ward , gender
            });
            
            res.status(201).json({     
                message : "Patient created successfully",
                data : patient
            });
        } catch (error) {
            console.error("Backend Create Patient Error:", error);
            res.status(500).json({
                message : "Internal server error occurred while creating patient."
            });
        }
    }


    const getPatients = async (req, res) => {
        try{
            const patients = await patientmodel.find().populate("admittedBy", "name email");
            res.status(200).json({
                message : "Patients fetched successfully",
                data : patients
            });
        } 

        catch(error){
            console.error("Backend Get Patients Error:", error);
            res.status(500).json({
                message : "Internal server error occurred while fetching patients."
            });  
        }
    }

    const deletepatient = async (req, res) => { 
    try {
        const patientId = req.params.id; 
        
        // Find and delete the patient document in one step
        const patient = await patientmodel.findByIdAndDelete(patientId); 

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        } 

        return res.status(200).json({
            message: "Patient record deleted successfully"
        });
    } catch (error) {
        console.error("Backend Delete Patient Error:", error);
        return res.status(500).json({
            message: "Internal server error occurred while deleting patient."
        }); 
    }
}; 


    const updatePatient = async (req, res) => {
    try {
        // Defensive fix: trim incoming parameter ID
        const patientId = req.params.id.trim(); 
        const { name, age, disease, ward, gender } = req.body; 

        // Grab the ID of the currently logged-in user from your middleware
        const updatedByUserId = req.user.id; 

        // Update fields AND overwrite the admittedBy field with the current user's ID
        const patient = await patientmodel.findByIdAndUpdate(
            patientId, 
            {  
                name, 
                age, 
                disease, 
                ward, 
                gender,
                admittedBy: updatedByUserId // Update tracking here
            }, 
            { new: true, runValidators: true } // runValidators ensures Mongoose checks schema constraints
        );

        if (!patient) { 
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Patient updated successfully",
            data: patient
        });
    } catch (error) {
        console.error("Backend Update Patient Error:", error);
        return res.status(500).json({
            message: "Internal server error occurred while updating patient."
        });
    }
}; 
    module.exports = {
        createPatient, 
        getPatients,
        updatePatient,
        deletepatient 
    } 
     