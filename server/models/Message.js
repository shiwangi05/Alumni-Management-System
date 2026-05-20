const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mentorshipRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MentorshipRequest',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            maxlength: 2000,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

messageSchema.index({ mentorshipRequest: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
