const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho Avatar
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/avatars',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Cấu hình storage cho CV
const cvStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/cvs',
        resource_type: 'raw',
        allowed_formats: ['pdf', 'doc', 'docx', 'txt']
    }
});

module.exports = {
    cloudinary,
    avatarStorage,
    cvStorage
};