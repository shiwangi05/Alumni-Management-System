const express = require('express');
const router = express.Router();
const {
    getJobs,
    createJob,
    deleteJob,
    applyToJob,
    getJobApplicants,
    updateJobStatus
} = require('../controllers/jobController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const jobValidation = [
    body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 100 }).withMessage('Job title must be 100 characters or fewer').escape(),
    body('company').trim().notEmpty().withMessage('Company is required').escape(),
    body('location').trim().notEmpty().withMessage('Location is required').escape(),
    body('type').isIn(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance']).withMessage('Invalid job type'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('requirements').trim().notEmpty().withMessage('Requirements are required'),
    body('link').optional({ checkFalsy: true }).trim().isURL().withMessage('Link must be a valid URL'),
    body('salary').optional({ checkFalsy: true }).trim().escape(),
];

const applyValidation = [
    body('coverNote')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 }).withMessage('Cover note must be 500 characters or fewer')
        .escape(),
];

const statusValidation = [
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
];

router.get('/', auth, getJobs);
router.post('/', auth, roleCheck('alumni', 'admin'), jobValidation, validate, createJob);
router.delete('/:id', auth, roleCheck('alumni', 'admin'), deleteJob);
router.post('/:id/apply', auth, roleCheck('student'), applyValidation, validate, applyToJob);
router.get('/:id/applicants', auth, roleCheck('alumni', 'admin'), getJobApplicants);
router.put('/:id/status', auth, roleCheck('admin'), statusValidation, validate, updateJobStatus);

module.exports = router;
