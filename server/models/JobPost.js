const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            maxlength: 100,
        },
        company: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'],
            required: [true, 'Job type is required'],
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
        },
        requirements: {
            type: String,
            required: [true, 'Requirements are required'],
        },
        link: {
            type: String,
            trim: true,
        },
        salary: {
            type: String,
            trim: true,
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        applicants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('JobPost', jobPostSchema);
