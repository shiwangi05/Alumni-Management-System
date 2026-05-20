const Event = require('../models/Event');
const { sendEventRsvpEmail } = require('../utils/email');

// @desc    Create an event
// @route   POST /api/events
// @access  Private (admin)
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create({ ...req.body, createdBy: req.user._id });
        await event.populate('createdBy', 'name');
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all events (upcoming + past)
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
    try {
        const { filter } = req.query; // 'upcoming' | 'past' | all
        const query = { isActive: true };
        const now = new Date();
        if (filter === 'upcoming') query.date = { $gte: now };
        if (filter === 'past') query.date = { $lt: now };

        const events = await Event.find(query)
            .populate('createdBy', 'name')
            .sort({ date: filter === 'past' ? -1 : 1 });

        // Attach rsvp count and whether current user RSVPed
        const result = events.map((ev) => {
            const obj = ev.toObject();
            obj.rsvpCount = ev.rsvps.length;
            obj.hasRsvped = ev.rsvps.some(
                (r) => r.user.toString() === req.user._id.toString()
            );
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('rsvps.user', 'name role');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (admin)
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('createdBy', 'name');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (admin)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    RSVP or cancel RSVP for an event
// @route   POST /api/events/:id/rsvp
// @access  Private
exports.toggleRsvp = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const userId = req.user._id.toString();
        const alreadyRsvped = event.rsvps.some((r) => r.user.toString() === userId);

        if (alreadyRsvped) {
            // Cancel RSVP
            event.rsvps = event.rsvps.filter((r) => r.user.toString() !== userId);
            await event.save();
            return res.json({ message: 'RSVP cancelled', hasRsvped: false, rsvpCount: event.rsvps.length });
        } else {
            // Add RSVP
            event.rsvps.push({ user: req.user._id });
            await event.save();

            // Send confirmation email (non-blocking)
            sendEventRsvpEmail({
                userEmail: req.user.email,
                userName: req.user.name,
                eventTitle: event.title,
                eventDate: event.date,
                eventVenue: event.venue,
            });

            return res.json({ message: 'RSVP confirmed', hasRsvped: true, rsvpCount: event.rsvps.length });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
