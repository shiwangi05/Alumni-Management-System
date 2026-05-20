const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getConversation,
    getMyConversations,
    deleteMessage,
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/conversations', auth, roleCheck('student', 'alumni'), getMyConversations);
router.post('/', auth, roleCheck('student', 'alumni'), sendMessage);
router.get('/:mentorshipRequestId', auth, roleCheck('student', 'alumni'), getConversation);
router.delete('/:id', auth, roleCheck('student', 'alumni'), deleteMessage);

module.exports = router;
