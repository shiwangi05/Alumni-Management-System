const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Message = require('../models/Message');
const Event = require('../models/Event');
const Story = require('../models/Story');
const JobPost = require('../models/JobPost');
const Notification = require('../models/Notification');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAlumni,
            totalStudents,
            totalMentorships,
            pendingMentorships,
            acceptedMentorships,
            rejectedMentorships,
            totalMessages,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'alumni' }),
            User.countDocuments({ role: 'student' }),
            MentorshipRequest.countDocuments(),
            MentorshipRequest.countDocuments({ status: 'pending' }),
            MentorshipRequest.countDocuments({ status: 'accepted' }),
            MentorshipRequest.countDocuments({ status: 'rejected' }),
            Message.countDocuments(),
        ]);

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });

        res.json({
            totalUsers,
            totalAlumni,
            totalStudents,
            totalMentorships,
            pendingMentorships,
            acceptedMentorships,
            rejectedMentorships,
            totalMessages,
            recentRegistrations,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            users,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow deleting admin accounts
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin accounts' });
        }

        // Clean up related data and references.
        await Promise.all([
            MentorshipRequest.deleteMany({
                $or: [{ student: user._id }, { alumni: user._id }],
            }),
            Message.deleteMany({
                $or: [{ sender: user._id }, { receiver: user._id }],
            }),
            Event.deleteMany({ createdBy: user._id }),
            Event.updateMany({}, { $pull: { rsvps: { user: user._id } } }),
            Story.deleteMany({ author: user._id }),
            Story.updateMany({}, { $pull: { likes: user._id, comments: { user: user._id } } }),
            JobPost.deleteMany({ postedBy: user._id }),
            JobPost.updateMany({}, { $pull: { applicants: { user: user._id } } }),
            Notification.deleteMany({
                $or: [{ recipient: user._id }, { sender: user._id }],
            }),
        ]);

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and related data removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all mentorship requests
// @route   GET /api/admin/mentorships
// @access  Private (admin)
exports.getAllMentorships = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const total = await MentorshipRequest.countDocuments(query);
        const mentorships = await MentorshipRequest.find(query)
            .populate('student', 'name email course')
            .populate('alumni', 'name email company jobTitle')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            mentorships,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get analytics data for charts
// @route   GET /api/admin/analytics
// @access  Private (admin)
exports.getAnalytics = async (req, res) => {
    try {
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
            });
        }

        const rangeStart = new Date(last6Months[0].year, last6Months[0].monthIndex, 1);
        const monthKey = (year, month) => `${year}-${month}`;

        const [userGrowthRows, mentorshipRows, roleRows] = await Promise.all([
            User.aggregate([
                {
                    $match: {
                        role: { $in: ['student', 'alumni'] },
                        createdAt: { $gte: rangeStart },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            role: '$role',
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            MentorshipRequest.aggregate([
                { $match: { createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
        ]);

        const userGrowthMap = new Map();
        userGrowthRows.forEach((row) => {
            userGrowthMap.set(
                `${monthKey(row._id.year, row._id.month)}-${row._id.role}`,
                row.count
            );
        });

        const mentorshipMap = new Map();
        mentorshipRows.forEach((row) => {
            mentorshipMap.set(monthKey(row._id.year, row._id.month), row.count);
        });

        const roleMap = new Map(roleRows.map((row) => [row._id, row.count]));

        const userGrowth = last6Months.map((m) => {
            const key = monthKey(m.year, m.monthIndex + 1);
            return {
                name: m.name,
                students: userGrowthMap.get(`${key}-student`) || 0,
                alumni: userGrowthMap.get(`${key}-alumni`) || 0,
            };
        });

        const mentorshipTrends = last6Months.map((m) => {
            const key = monthKey(m.year, m.monthIndex + 1);
            return {
                name: m.name,
                requests: mentorshipMap.get(key) || 0,
            };
        });

        const roleDistribution = [
            { name: 'Alumni', value: roleMap.get('alumni') || 0 },
            { name: 'Students', value: roleMap.get('student') || 0 },
            { name: 'Admins', value: roleMap.get('admin') || 0 }
        ];

        res.json({
            userGrowth,
            mentorshipTrends,
            roleDistribution
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
