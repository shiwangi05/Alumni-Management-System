const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadAvatar } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// Store file in memory buffer (then send to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
