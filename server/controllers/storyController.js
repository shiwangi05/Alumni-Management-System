const Story = require('../models/Story');

// @desc    Create a story
// @route   POST /api/stories
// @access  Private (alumni)
exports.createStory = async (req, res) => {
    try {
        const story = await Story.create({ ...req.body, author: req.user._id });
        await story.populate('author', 'name avatar company jobTitle graduationYear');
        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all approved stories (feed)
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
    try {
        const { category, featured, page = 1, limit = 10 } = req.query;
        const query = { isApproved: true };
        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;

        const total = await Story.countDocuments(query);
        const stories = await Story.find(query)
            .populate('author', 'name avatar company jobTitle graduationYear')
            .populate('comments.user', 'name avatar role')
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const result = stories.map((s) => {
            const obj = s.toObject();
            obj.likeCount = s.likes.length;
            obj.hasLiked = s.likes.some((id) => id.toString() === req.user._id.toString());
            return obj;
        });

        res.json({ stories: result, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
exports.getStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate('author', 'name avatar company jobTitle graduationYear')
            .populate('comments.user', 'name avatar role')
            .populate('likes', 'name');
        if (!story) return res.status(404).json({ message: 'Story not found' });
        res.json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update own story
// @route   PUT /api/stories/:id
// @access  Private (alumni — own story)
exports.updateStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        if (story.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await Story.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('author', 'name avatar company jobTitle');

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (author or admin)
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        if (story.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Story.findByIdAndDelete(req.params.id);
        res.json({ message: 'Story removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle like on a story
// @route   POST /api/stories/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const userId = req.user._id.toString();
        const alreadyLiked = story.likes.some((id) => id.toString() === userId);

        if (alreadyLiked) {
            story.likes = story.likes.filter((id) => id.toString() !== userId);
        } else {
            story.likes.push(req.user._id);
        }

        await story.save();
        res.json({ likeCount: story.likes.length, hasLiked: !alreadyLiked });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a comment
// @route   POST /api/stories/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });

        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        story.comments.push({ user: req.user._id, text: text.trim() });
        await story.save();

        await story.populate('comments.user', 'name avatar role');
        res.status(201).json(story.comments[story.comments.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/stories/:id/comment/:commentId
// @access  Private (comment author or admin)
exports.deleteComment = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const comment = story.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        story.comments = story.comments.filter(
            (c) => c._id.toString() !== req.params.commentId
        );
        await story.save();
        res.json({ message: 'Comment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle featured on a story (admin only)
// @route   PUT /api/stories/:id/feature
// @access  Private (admin)
exports.toggleFeature = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });
        story.isFeatured = !story.isFeatured;
        await story.save();
        res.json({ isFeatured: story.isFeatured });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
