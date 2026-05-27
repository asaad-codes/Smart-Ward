const express = require("express");
const vitalController = require("../controllers/vital.controller");

const VerifyToken = require("../middleware/auth.middleware");
const { AllowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

/*
ROLE ACCESS RULES FOR VITALS:

admin:
- Create, view, update, delete all vitals

doctor:
- Create, view, update, delete all vitals

nurse:
- Create, view, update, delete all vitals

patient:
- Can only view own vitals through /myvitals
*/

// Patient can view only own vitals
router.get(
    "/myvitals",
    VerifyToken,
    AllowRoles("patient"),
    vitalController.getMyVitals
);

// Admin, doctor, nurse can create vitals
router.post(
    "/createvital",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    vitalController.createVital
);

// Admin, doctor, nurse can view all vitals
router.get(
    "/getvitals",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    vitalController.getVitals
);

// Admin, doctor, nurse can update vitals
router.put(
    "/updatevital/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    vitalController.updateVital
);

// Admin, doctor, nurse can delete vitals
router.delete(
    "/deletevital/:id",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse"),
    vitalController.deleteVital
);

module.exports = router; 