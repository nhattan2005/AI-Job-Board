const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// 👇 ĐỌC TỪ .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? '****' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET'
});

// 📸 CẤU HÌNH CHO AVATAR (JPG/PNG)
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/avatars', // Thư mục trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'fill' }], // Resize ảnh
        public_id: (req, file) => {
            // Tạo tên file unique: user_123_1234567890
            return `user_${req.user?.id || 'unknown'}_${Date.now()}`;
        }
    }
});

// 📄 CẤU HÌNH CHO CV (PDF/DOCX)
const cvStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-job-board/cvs',
        resource_type: 'raw',
        allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
        public_id: (req, file) => {
            const userId = req.user?.id || 'unknown';
            const timestamp = Date.now();
            const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
            
            // 👇 THÊM: Lấy extension từ originalname
            const extension = file.originalname.split('.').pop().toLowerCase();
            
            // 👇 RETURN với extension
            return `cv_${userId}_${originalName}_${timestamp}.${extension}`;
        }
    }
});

module.exports = {
    cloudinary,
    avatarStorage,
    cvStorage
};