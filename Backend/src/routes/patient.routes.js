const express = require('express');
const patientcontroller = require('../controllers/patient.controller');
const VerifyToken = require('../middleware/auth.middleware');


const router = express.Router();

router.post('/createpatient', VerifyToken, patientcontroller.createPatient); 

router.get('/getpatients', VerifyToken, patientcontroller.getPatients); 

router.delete('/deletepatient/:id', VerifyToken, patientcontroller.deletepatient);  

router.put('/updatepatient/:id', VerifyToken, patientcontroller.updatePatient); 

module.exports = router;   