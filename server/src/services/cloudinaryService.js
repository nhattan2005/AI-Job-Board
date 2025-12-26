const cloudinary = require('cloudinary').v2;

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {number} userId - User ID for folder organization
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, originalName, userId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `cvs/${userId}`,
                resource_type: 'raw',
                public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
                format: 'pdf'
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    return reject(error);
                }
                console.log('✅ Cloudinary upload success:', result.secure_url);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
        });
        console.log('✅ Cloudinary delete success:', publicId);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
        throw error;
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary
};