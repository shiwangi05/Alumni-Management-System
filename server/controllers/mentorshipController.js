const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { sendMentorshipStatusEmail } = require('../utils/email');

// @desc    Create mentorship request (Student → Alumni)
// @route   POST /api/mentorship/request
// @access  Private (student)
exports.createRequest = async (req, res) => {
    try {
        const { alumniId, message } = req.body;

        // Verify alumni exists and has 'alumni' role
        const alumni = await User.findOne({ _id: alumniId, role: 'alumni' });
        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        // Check for existing pending request
        const existingRequest = await MentorshipRequest.findOne({
            student: req.user._id,
            alumni: alumniId,
            status: 'pending',
        });

        if (existingRequest) {
            return res
                .status(400)
                .json({ message: 'You already have a pending request with this alumni' });
        }

        const request = await MentorshipRequest.create({
            student: req.user._id,
            alumni: alumniId,
            message,
        });

        const populated = await request.populate([
            { path: 'student', select: 'name email course' },
            { path: 'alumni', select: 'name email company jobTitle' },
        ]);

        // Create and emit notification
        const notification = await Notification.create({
            recipient: alumniId,
            sender: req.user._id,
            type: 'mentorship_request',
            content: `${req.user.name} has requested your mentorship.`,
            link: '/mentorship'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(alumniId.toString()).emit('new_notification', notification);
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my mentorship requests (student sees sent, alumni sees received)
// @route   GET /api/mentorship/my-requests
// @access  Private (student, alumni)
exports.getMyRequests = async (req, res) => {
    try {
        const query =
            req.user.role === 'student'
                ? { student: req.user._id }
                : { alumni: req.user._id };

        const requests = await MentorshipRequest.find(query)
            .populate('student', 'name email course enrollmentYear avatar')
            .populate('alumni', 'name email company jobTitle industry avatar')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update mentorship request status (accept / reject)
// @route   PUT /api/mentorship/:id
// @access  Private (alumni)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected' });
        }

        const request = await MentorshipRequest.findOne({
            _id: req.params.id,
            alumni: req.user._id,
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res
                .status(400)
                .json({ message: 'This request has already been processed' });
        }

        request.status = status;
        await request.save();

        const populated = await request.populate([
            { path: 'student', select: 'name email course' },
            { path: 'alumni', select: 'name email company jobTitle' },
        ]);

        // Notify student via email (non-blocking)
        sendMentorshipStatusEmail({
            studentEmail: populated.student.email,
            studentName: populated.student.name,
            alumniName: populated.alumni.name,
            status,
        });

        // Create and emit in-app notification
        const notification = await Notification.create({
            recipient: populated.student._id,
            sender: req.user._id,
            type: status === 'accepted' ? 'mentorship_accepted' : 'mentorship_rejected',
            content: `${req.user.name} has ${status} your mentorship request.`,
            link: '/mentorship'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(populated.student._id.toString()).emit('new_notification', notification);
        }

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    End/Delete a mentorship (and chat)
// @route   DELETE /api/mentorship/:id
// @access  Private (student, alumni)
exports.endMentorship = async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Mentorship request not found' });
        }

        // Verify the user is part of this mentorship
        const isParticipant =
            request.student.toString() === req.user._id.toString() ||
            request.alumni.toString() === req.user._id.toString();

        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not authorized to end this mentorship' });
        }

        // Delete the mentorship request
        await MentorshipRequest.findByIdAndDelete(req.params.id);

        await Message.deleteMany({ mentorshipRequest: req.params.id });

        res.json({ message: 'Mentorship and chat history ended successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete only chat messages for a mentorship
// @route   DELETE /api/mentorship/:id/messages-only
// @access  Private (student, alumni participant)
exports.clearMentorshipMessages = async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Mentorship request not found' });
        }

        const isParticipant =
            request.student.toString() === req.user._id.toString() ||
            request.alumni.toString() === req.user._id.toString();

        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not authorized to clear this chat' });
        }

        await Message.deleteMany({ mentorshipRequest: req.params.id });

        res.json({ message: 'Chat history deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
