const express = require('express');
const router = express.Router();
const {
    getStudentProfile,
    updateStudentProfile,
} = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/profile', auth, roleCheck('student'), getStudentProfile);
router.put('/profile', auth, roleCheck('student'), updateStudentProfile);

module.exports = router;
