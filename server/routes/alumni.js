const express = require('express');
const router = express.Router();
const {
    getAlumniDirectory,
    getAlumniProfile,
    updateAlumniProfile,
} = require('../controllers/alumniController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/directory', auth, getAlumniDirectory);
router.get('/:id', auth, getAlumniProfile);
router.put('/profile', auth, roleCheck('alumni'), updateAlumniProfile);

module.exports = router;
