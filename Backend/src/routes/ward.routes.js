const express = require("express");
const wardController = require("../controllers/ward.controller");

const VerifyToken = require("../middleware/auth.middleware");
const { AllowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

/*
ROLE ACCESS RULES FOR WARDS:

admin:
- Can create ward
- Can view wards
- Can update ward
- Can delete ward

doctor:
- Can view wards
- Can update ward
- Can delete ward
- Cannot create/add ward

nurse:
- No ward access

patient:
- No ward access
*/

// Admin only can create/add ward
router.post(
    "/createward",
    VerifyToken,
    AllowRoles("admin"),
    wardController.createWard
);

// Admin and doctor can view wards
router.get(
    "/getwards",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    wardController.getWards
);

// Admin and doctor can update ward
router.put(
    "/updateward/:id",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    wardController.updateWard
);

// Admin and doctor can delete ward
router.delete(
    "/deleteward/:id",
    VerifyToken,
    AllowRoles("admin", "doctor"),
    wardController.deleteWard
);

module.exports = router; 