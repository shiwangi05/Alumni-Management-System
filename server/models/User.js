const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
            maxlength: 50,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['admin', 'alumni', 'student'],
            default: 'student',
        },
        avatar: {
            type: String,
            default: '',
        },

        // ── Alumni-specific fields ──
        graduationYear: { type: Number },
        company: { type: String, trim: true },
        jobTitle: { type: String, trim: true },
        industry: { type: String, trim: true },
        skills: [{ type: String, trim: true }],
        linkedin: { type: String, trim: true },

        // ── Student-specific fields ──
        enrollmentYear: { type: Number },
        course: { type: String, trim: true },
        interests: [{ type: String, trim: true }],

        // ── Shared ──
        bio: { type: String, maxlength: 500 },
        phone: { type: String, trim: true },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hash
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
