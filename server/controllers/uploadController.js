const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

// Configure Cloudinary (credentials from .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Upload avatar (base64 or buffer)
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check Cloudinary config
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return res.status(500).json({ message: 'Image upload not configured. Please set Cloudinary env vars.' });
        }

        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'alumni_connect/avatars',
                    transformation: [
                        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Update user avatar in DB
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: result.secure_url },
            { new: true }
        ).select('-password');

        res.json({ avatarUrl: result.secure_url, user });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
};
