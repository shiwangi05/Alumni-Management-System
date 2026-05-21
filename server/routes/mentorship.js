const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    updateRequestStatus,
    endMentorship,
    clearMentorshipMessages,
} = require('../controllers/mentorshipController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const requestValidation = [
    body('alumniId').isMongoId().withMessage('Valid alumni id is required'),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 1000 }).withMessage('Message must be 1000 characters or fewer')
        .escape(),
];

const statusValidation = [
    body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
];

router.post('/request', auth, roleCheck('student'), requestValidation, validate, createRequest);
router.get('/my-requests', auth, roleCheck('student', 'alumni'), getMyRequests);
router.put('/:id', auth, roleCheck('alumni'), statusValidation, validate, updateRequestStatus);
router.delete('/:id/messages-only', auth, roleCheck('student', 'alumni'), clearMentorshipMessages);
router.delete('/:id', auth, roleCheck('student', 'alumni'), endMentorship);

module.exports = router;
