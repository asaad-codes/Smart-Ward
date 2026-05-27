const express = require("express");
const medicationController = require("../controllers/medication.controller");

const VerifyToken = require("../middleware/auth.middleware");
const { AllowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

/*
ROLE ACCESS:

admin:
- Full medication access

doctor:
- Full medication access

nurse:
- Full medication access

patient:
- Can only view own medications
*/

// Patient can only see own medications
router.get(
    "/mymedications",
    VerifyToken,
    AllowRoles("patient"),
    medicationController.getMyMedications
);

// Admin, doctor, nurse can create medication
router.post(
    "/createmedication",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.createMedication
);

// Admin, doctor, nurse can view all medications
router.get(
    "/getmedications",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.getMedications
);

// Admin, doctor, nurse can update medication
router.put(
    "/updatemedication/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.updateMedication
);

// Admin, doctor, nurse can mark medication as given
router.put(
    "/markgiven/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.markMedicationGiven
);

// Admin, doctor, nurse can mark medication as missed
router.put(
    "/markmissed/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.markMedicationMissed
);

// Admin, doctor, nurse can delete medication
router.delete(
    "/deletemedication/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    medicationController.deleteMedication
);

module.exports = router; 