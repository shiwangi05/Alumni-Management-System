const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    updateRequestStatus,
    endMentorship,
} = require('../controllers/mentorshipController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/request', auth, roleCheck('student'), createRequest);
router.get('/my-requests', auth, roleCheck('student', 'alumni'), getMyRequests);
router.put('/:id', auth, roleCheck('alumni'), updateRequestStatus);
router.delete('/:id', auth, roleCheck('student', 'alumni'), endMentorship);

module.exports = router;
