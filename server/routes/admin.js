const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllMentorships,
    getAnalytics,
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/stats', auth, roleCheck('admin'), getDashboardStats);
router.get('/users', auth, roleCheck('admin'), getAllUsers);
router.delete('/users/:id', auth, roleCheck('admin'), deleteUser);
router.get('/mentorships', auth, roleCheck('admin'), getAllMentorships);
router.get('/analytics', auth, roleCheck('admin'), getAnalytics);

module.exports = router;
