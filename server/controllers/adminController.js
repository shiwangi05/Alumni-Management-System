const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Message = require('../models/Message');

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

        // Clean up related data
        await MentorshipRequest.deleteMany({
            $or: [{ student: user._id }, { alumni: user._id }],
        });
        await Message.deleteMany({
            $or: [{ sender: user._id }, { receiver: user._id }],
        });

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

        // Get actual User Growth by aggregating over the last 6 months
        const userGrowth = await Promise.all(
            last6Months.map(async (m) => {
                const startDate = new Date(m.year, m.monthIndex, 1);
                const endDate = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);

                const students = await User.countDocuments({
                    role: 'student',
                    createdAt: { $gte: startDate, $lte: endDate }
                });

                const alumni = await User.countDocuments({
                    role: 'alumni',
                    createdAt: { $gte: startDate, $lte: endDate }
                });

                return {
                    name: m.name,
                    students,
                    alumni
                };
            })
        );

        // Get actual Mentorship trends
        const mentorshipTrends = await Promise.all(
            last6Months.map(async (m) => {
                const startDate = new Date(m.year, m.monthIndex, 1);
                const endDate = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);

                const requests = await MentorshipRequest.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate }
                });

                return {
                    name: m.name,
                    requests
                };
            })
        );

        // Fetch actual current aggregates
        const totalAlumni = await User.countDocuments({ role: 'alumni' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const roleDistribution = [
            { name: 'Alumni', value: totalAlumni },
            { name: 'Students', value: totalStudents },
            { name: 'Admins', value: totalAdmins }
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
