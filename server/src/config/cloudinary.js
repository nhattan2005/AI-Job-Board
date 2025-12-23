const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho Avatar (Lưu vào folder 'avatars')
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/avatars',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Tự động resize
    }
});

// Cấu hình storage cho CV (Lưu vào folder 'cvs')
// Lưu ý: Cloudinary hỗ trợ lưu PDF/Raw files
const cvStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/cvs',
        resource_type: 'raw', // Quan trọng cho PDF/DOCX
        allowed_formats: ['pdf', 'doc', 'docx', 'txt']
    }
});

module.exports = {
    cloudinary,
    avatarStorage,
    cvStorage
};