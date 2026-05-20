const express = require('express');
const router = express.Router();
const {
    createStory,
    getStories,
    getStory,
    updateStory,
    deleteStory,
    toggleLike,
    addComment,
    deleteComment,
    toggleFeature,
} = require('../controllers/storyController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require login
router.use(auth);

router.get('/', getStories);
router.get('/:id', getStory);
router.post('/:id/like', toggleLike);
router.post('/:id/comment', addComment);
router.delete('/:id/comment/:commentId', deleteComment);

// Alumni can post stories
router.post('/', roleCheck('alumni'), createStory);
router.put('/:id', updateStory);
router.delete('/:id', deleteStory);

// Admin can feature/unfeature
router.put('/:id/feature', roleCheck('admin'), toggleFeature);

module.exports = router;
