const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    toggleRsvp,
} = require('../controllers/eventController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require login
router.use(auth);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/:id/rsvp', toggleRsvp);

// Admin only
router.post('/', roleCheck('admin'), createEvent);
router.put('/:id', roleCheck('admin'), updateEvent);
router.delete('/:id', roleCheck('admin'), deleteEvent);

module.exports = router;
