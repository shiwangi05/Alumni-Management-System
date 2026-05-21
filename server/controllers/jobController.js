const JobPost = require('../models/JobPost');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all job posts
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
    try {
        const { type, search, page = 1, limit = 10 } = req.query;
        const query = { isActive: true };
        const andConditions = [];

        // Admin sees all, others see approved or their own
        if (req.user.role !== 'admin') {
            andConditions.push({
                $or: [{ status: 'approved' }, { status: { $exists: false } }, { postedBy: req.user._id }]
            });
        }

        if (type) andConditions.push({ type });
        if (search) {
            andConditions.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { company: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        const total = await JobPost.countDocuments(query);
        const jobs = await JobPost.find(query)
            .populate('postedBy', 'name avatar company jobTitle')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            jobs,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a job post
// @route   POST /api/jobs
// @access  Private (Alumni, Admin)
exports.createJob = async (req, res) => {
    try {
        const status = req.user.role === 'admin' ? 'approved' : 'pending';
        const job = await JobPost.create({
            ...req.body,
            postedBy: req.user._id,
            status,
        });
        const populatedJob = await job.populate('postedBy', 'name avatar company jobTitle');

        // Notify all student users about the new job asynchronously if approved immediately
        if (status === 'approved') {
            (async () => {
                try {
                    const students = await User.find({ role: 'student', _id: { $ne: req.user._id } }).select('_id');
                    const notifications = students.map(u => ({
                        recipient: u._id,
                        sender: req.user._id,
                        type: 'system',
                        content: `New job posted: ${job.title} at ${job.company}`,
                        link: '/jobs'
                    }));
                    await Notification.insertMany(notifications);
                    const io = req.app.get('io');
                    if (io) {
                        const notificationDoc = {
                            sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
                            type: 'system',
                            content: `New job posted: ${job.title} at ${job.company}`,
                            link: '/jobs',
                            createdAt: new Date(),
                            isRead: false
                        };
                        students.forEach(u => {
                            io.to(u._id.toString()).emit('new_notification', notificationDoc);
                        });
                    }
                } catch (err) {
                    console.error("Error creating job notifications:", err);
                }
            })();
        }

        res.status(201).json(populatedJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a job post
// @route   DELETE /api/jobs/:id
// @access  Private (Author, Admin)
exports.deleteJob = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await JobPost.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Student)
exports.applyToJob = async (req, res) => {
    try {
        const { coverNote = '' } = req.body;
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!job.isActive || job.status !== 'approved') {
            return res.status(400).json({ message: 'This job is not open for applications' });
        }

        if (job.postedBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot apply to your own job post' });
        }

        const hasApplied = job.applicants.some((applicant) => {
            const applicantUser = applicant.user || applicant;
            return applicantUser.toString() === req.user._id.toString();
        });

        if (hasApplied) {
            return res.status(400).json({ message: 'You have already applied' });
        }

        job.applicants.push({
            user: req.user._id,
            coverNote,
        });
        await job.save();

        const notification = await Notification.create({
            recipient: job.postedBy,
            sender: req.user._id,
            type: 'system',
            content: `${req.user.name} applied to: ${job.title}`,
            link: '/jobs'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(job.postedBy.toString()).emit('new_notification', notification);
        }

        res.json({ message: 'Successfully applied', applicants: job.applicants });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get applicants for a job post
// @route   GET /api/jobs/:id/applicants
// @access  Private (Poster, Admin)
exports.getJobApplicants = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id)
            .populate('applicants.user', 'name avatar course email');

        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view applicants' });
        }

        res.json({
            applicants: job.applicants.map((applicant) => ({
                user: applicant.user,
                appliedAt: applicant.appliedAt,
                coverNote: applicant.coverNote || '',
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject a job post
// @route   PUT /api/jobs/:id/status
// @access  Private (Admin)
exports.updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const previousStatus = job.status;
        job.status = status;
        await job.save();

        // Notify poster
        const notification = await Notification.create({
            recipient: job.postedBy,
            sender: req.user._id,
            type: 'system',
            content: `Your job post "${job.title}" has been ${status}.`,
            link: '/jobs'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(job.postedBy.toString()).emit('new_notification', notification);
        }

        // If newly approved, notify all student users
        if (status === 'approved') {
            (async () => {
                try {
                    const students = await User.find({ role: 'student' }).select('_id');
                    const notifications = students.map(s => ({
                        recipient: s._id,
                        sender: req.user._id,
                        type: 'system',
                        content: `New job opportunity approved: ${job.title} at ${job.company}`,
                        link: '/jobs'
                    }));
                    await Notification.insertMany(notifications);
                    if (io) {
                        const broadcastDoc = {
                            sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
                            type: 'system',
                            content: `New job opportunity approved: ${job.title} at ${job.company}`,
                            link: '/jobs',
                            createdAt: new Date(),
                            isRead: false
                        };
                        students.forEach(s => {
                            io.to(s._id.toString()).emit('new_notification', broadcastDoc);
                        });
                    }
                } catch (err) {
                    console.error("Error broadcasting job approval notification:", err);
                }
            })();
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
