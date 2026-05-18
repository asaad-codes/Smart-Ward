const express = require('express');
const wardController = require('../controllers/ward.controller');
const VerifyToken = require('../middleware/auth.middleware'); 

const router = express.Router();

router.post('/createward', VerifyToken, wardController.createWard);
router.get('/wards', VerifyToken, wardController.getWards); 

router.get('/wards/:id', VerifyToken, wardController.getSingleWard);

router.put('/wards/:id', VerifyToken, wardController.updateWard); 

module.exports = router;  