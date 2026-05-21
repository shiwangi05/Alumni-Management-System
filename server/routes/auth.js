const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, verifyOtp, resendOtp, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer')
        .escape(),
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['student', 'alumni']).withMessage('Role must be student or alumni'),
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
];

const otpValidation = [
    body('userId').isMongoId().withMessage('Valid user id is required'),
    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers'),
];

const resendOtpValidation = [
    body('userId').isMongoId().withMessage('Valid user id is required'),
];

const resendOtpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    message: { message: 'Please wait 60 seconds before requesting another OTP' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/verify-otp', otpValidation, validate, verifyOtp);
router.post('/resend-otp', resendOtpLimiter, resendOtpValidation, validate, resendOtp);
router.get('/me', auth, getMe);

module.exports = router;
