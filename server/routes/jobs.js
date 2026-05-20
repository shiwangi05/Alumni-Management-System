const express = require('express');
const router = express.Router();
const {
    getJobs,
    createJob,
    deleteJob,
    applyToJob,
    updateJobStatus
} = require('../controllers/jobController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, getJobs);
router.post('/', auth, roleCheck('alumni', 'admin'), createJob);
router.delete('/:id', auth, roleCheck('alumni', 'admin'), deleteJob);
router.post('/:id/apply', auth, roleCheck('student'), applyToJob);
router.put('/:id/status', auth, roleCheck('admin'), updateJobStatus);

module.exports = router;
