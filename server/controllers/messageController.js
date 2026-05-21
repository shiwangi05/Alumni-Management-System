const Message = require('../models/Message');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Send a message (only if mentorship is accepted)
// @route   POST /api/messages
// @access  Private (student, alumni)
exports.sendMessage = async (req, res) => {
    try {
        const { mentorshipRequestId, content } = req.body;

        // Find the mentorship request and verify it's accepted
        const mentorship = await MentorshipRequest.findById(mentorshipRequestId);
        if (!mentorship) {
            return res.status(404).json({ message: 'Mentorship request not found' });
        }

        if (mentorship.status !== 'accepted') {
            return res
                .status(400)
                .json({ message: 'Can only message in accepted mentorships' });
        }

        // Verify the sender is part of this mentorship
        const isStudent = mentorship.student.toString() === req.user._id.toString();
        const isAlumni = mentorship.alumni.toString() === req.user._id.toString();

        if (!isStudent && !isAlumni) {
            return res
                .status(403)
                .json({ message: 'You are not part of this mentorship' });
        }

        const receiver = isStudent ? mentorship.alumni : mentorship.student;

        const message = await Message.create({
            sender: req.user._id,
            receiver,
            mentorshipRequest: mentorshipRequestId,
            content,
        });

        const populated = await message.populate('sender', 'name avatar');

        // Create and emit notification
        const notification = await Notification.create({
            recipient: receiver,
            sender: req.user._id,
            type: 'new_message',
            content: `New message from ${req.user.name}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
            link: '/conversations'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(receiver.toString()).emit('new_notification', notification);
            // Also emit the message itself for live chat functionality
            io.to(receiver.toString()).emit('new_message', populated);
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a mentorship conversation
// @route   GET /api/messages/:mentorshipRequestId
// @access  Private (student, alumni)
exports.getConversation = async (req, res) => {
    try {
        const mentorship = await MentorshipRequest.findById(
            req.params.mentorshipRequestId
        );

        if (!mentorship) {
            return res.status(404).json({ message: 'Mentorship request not found' });
        }

        // Verify the user is part of this mentorship
        const isParticipant =
            mentorship.student.toString() === req.user._id.toString() ||
            mentorship.alumni.toString() === req.user._id.toString();

        if (!isParticipant) {
            return res
                .status(403)
                .json({ message: 'You are not part of this mentorship' });
        }

        const messages = await Message.find({
            mentorshipRequest: req.params.mentorshipRequestId,
        })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 });

        // Mark unread messages as read
        await Message.updateMany(
            {
                mentorshipRequest: req.params.mentorshipRequestId,
                receiver: req.user._id,
                read: false,
            },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private (student, alumni)
exports.getMyConversations = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const query =
            req.user.role === 'student'
                ? { student: userId, status: 'accepted' }
                : { alumni: userId, status: 'accepted' };

        const conversations = await MentorshipRequest.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'student',
                    pipeline: [{ $project: { name: 1, email: 1, avatar: 1, course: 1 } }],
                },
            },
            { $unwind: '$student' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'alumni',
                    foreignField: '_id',
                    as: 'alumni',
                    pipeline: [{ $project: { name: 1, email: 1, avatar: 1, company: 1, jobTitle: 1 } }],
                },
            },
            { $unwind: '$alumni' },
            {
                $lookup: {
                    from: 'messages',
                    let: { mentorshipId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$mentorshipRequest', '$$mentorshipId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                    ],
                    as: 'lastMessage',
                },
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { mentorshipId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$mentorshipRequest', '$$mentorshipId'] },
                                        { $eq: ['$receiver', userId] },
                                        { $eq: ['$read', false] },
                                    ],
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: 'unread',
                },
            },
            {
                $project: {
                    mentorship: {
                        _id: '$_id',
                        student: '$student',
                        alumni: '$alumni',
                        message: '$message',
                        status: '$status',
                        createdAt: '$createdAt',
                        updatedAt: '$updatedAt',
                    },
                    lastMessage: { $ifNull: [{ $arrayElemAt: ['$lastMessage', 0] }, null] },
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unread.count', 0] }, 0] },
                },
            },
            { $sort: { 'mentorship.updatedAt': -1 } },
        ]);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Verify the user is the sender of the message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        const receiverId = message.receiver;
        const messageId = message._id;
        
        await Message.findByIdAndDelete(req.params.id);

        const io = req.app.get('io');
        if (io) {
            io.to(receiverId.toString()).emit('message_deleted', messageId);
        }

        res.json({ message: 'Message deleted successfully', id: messageId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
