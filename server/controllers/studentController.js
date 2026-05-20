const User = require('../models/User');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (student)
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('-password');
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (student)
exports.updateStudentProfile = async (req, res) => {
    try {
        const allowedFields = [
            'name', 'bio', 'phone', 'avatar',
            'enrollmentYear', 'course', 'interests',
        ];

        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
