const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            required: [true, 'Event description is required'],
            maxlength: 2000,
        },
        date: {
            type: Date,
            required: [true, 'Event date is required'],
        },
        time: {
            type: String,
            trim: true,
        },
        venue: {
            type: String,
            trim: true,
        },
        link: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['reunion', 'webinar', 'career_fair', 'workshop', 'other'],
            default: 'other',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rsvps: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                rsvpAt: { type: Date, default: Date.now },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
