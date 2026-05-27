const express = require("express");
const patientcontroller = require("../controllers/patient.controller");

const VerifyToken = require("../middleware/auth.middleware");
const { AllowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

/*
ROLE ACCESS RULES:

admin:
- Can add patient
- Can view all patients
- Can update patient
- Can delete patient

doctor:
- Can view all patients
- Can update patient
- Can delete patient
- Cannot add patient

nurse:
- No patient route access here

patient:
- Can only view own patient record from /me
*/

// Patient can only see own record
router.get(
    "/me",
    VerifyToken,
    AllowRoles("patient"),
    patientcontroller.getMyPatientRecord
);

// Admin only can create/add patient
router.post(
    "/createpatient",
    VerifyToken,
    AllowRoles("admin"),
    patientcontroller.createPatient
);

// Admin and doctor can view all patients
router.get(
    "/getpatients",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    patientcontroller.getPatients
);

// Admin and doctor can update patient
router.put(
    "/updatepatient/:id",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    patientcontroller.updatePatient
);

// Admin and doctor can delete patient
router.delete(
    "/deletepatient/:id",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    patientcontroller.deletepatient
);

module.exports = router; 