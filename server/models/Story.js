const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true,
        },
    },
    { timestamps: true }
);

const storySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Story title is required'],
            trim: true,
            maxlength: 150,
        },
        content: {
            type: String,
            required: [true, 'Story content is required'],
            maxlength: 3000,
        },
        category: {
            type: String,
            enum: ['career', 'achievement', 'entrepreneurship', 'education', 'general'],
            default: 'general',
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        comments: [commentSchema],
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isApproved: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);
