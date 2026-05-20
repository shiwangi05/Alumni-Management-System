const User = require('../models/User');

// @desc    Get alumni directory with search & filter
// @route   GET /api/alumni/directory
// @access  Private
exports.getAlumniDirectory = async (req, res) => {
    try {
        const { search, industry, graduationYear, skills, page = 1, limit = 12 } = req.query;

        const query = { role: 'alumni' };

        // Text search on name, company, jobTitle
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { jobTitle: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by industry
        if (industry) {
            query.industry = { $regex: industry, $options: 'i' };
        }

        // Filter by graduation year
        if (graduationYear) {
            query.graduationYear = Number(graduationYear);
        }

        // Filter by skills (comma-separated)
        if (skills) {
            const skillArr = skills.split(',').map((s) => s.trim());
            query.skills = { $in: skillArr.map((s) => new RegExp(s, 'i')) };
        }

        const total = await User.countDocuments(query);
        const alumni = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            alumni,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single alumni profile
// @route   GET /api/alumni/:id
// @access  Private
exports.getAlumniProfile = async (req, res) => {
    try {
        const alumni = await User.findOne({
            _id: req.params.id,
            role: 'alumni',
        }).select('-password');

        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.json(alumni);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update alumni profile
// @route   PUT /api/alumni/profile
// @access  Private (alumni)
exports.updateAlumniProfile = async (req, res) => {
    try {
        const allowedFields = [
            'name', 'bio', 'phone', 'avatar',
            'graduationYear', 'company', 'jobTitle',
            'industry', 'skills', 'linkedin',
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
