const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }

    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        error: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;