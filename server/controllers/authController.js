const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendWelcomeEmail, sendVerificationEmail } = require('../utils/email');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const attachVerificationOtp = async (user) => {
    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    user.verificationOTP = await bcrypt.hash(otp, salt);
    user.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.verificationOTPSentAt = new Date();
    await user.save();
    return otp;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Prevent self-registration as admin
        const userRole = role === 'admin' ? 'student' : role || 'student';

        const user = await User.create({
            name,
            email,
            password,
            role: userRole,
        });

        const otp = await attachVerificationOtp(user);
        await sendVerificationEmail({ name: user.name, email: user.email, otp });

        res.status(201).json({
            message: 'OTP sent to your email. Please verify to continue.',
            userId: user._id,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email first.', userId: user._id });
        }

        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId).select('+verificationOTP +verificationOTPExpires');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            const token = generateToken(user._id);
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
            });
        }

        if (!user.verificationOTP || !user.verificationOTPExpires || user.verificationOTPExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, user.verificationOTP);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;
        user.verificationOTPSentAt = undefined;
        await user.save();

        sendWelcomeEmail({ name: user.name, email: user.email, role: user.role });

        const token = generateToken(user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend registration OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId).select('+verificationOTPSentAt');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        if (user.verificationOTPSentAt && Date.now() - user.verificationOTPSentAt.getTime() < 60 * 1000) {
            return res.status(429).json({ message: 'Please wait 60 seconds before requesting another OTP' });
        }

        const otp = await attachVerificationOtp(user);
        await sendVerificationEmail({ name: user.name, email: user.email, otp });

        res.json({ message: 'OTP sent to your email. Please verify to continue.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
