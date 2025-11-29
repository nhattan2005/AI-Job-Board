const fs = require('fs').promises;
const path = require('path');

// Extract text from file buffer (basic implementation)
const extractTextFromBuffer = async (buffer, mimetype) => {
    try {
        // For text files, just convert buffer to string
        if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        }

        // For other file types, you'd need specialized libraries:
        // - pdf-parse for PDFs
        // - mammoth for DOCX
        // - textract for general purpose
        
        // For now, just return buffer as text
        return buffer.toString('utf-8');
    } catch (error) {
        throw new Error('Failed to extract text from file: ' + error.message);
    }
};

// Save file to disk (if needed)
const saveFile = async (buffer, filename, uploadDir = 'uploads') => {
    try {
        // Create uploads directory if it doesn't exist
        await fs.mkdir(uploadDir, { recursive: true });
        
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, buffer);
        
        return filepath;
    } catch (error) {
        throw new Error('Failed to save file: ' + error.message);
    }
};

// Delete file from disk
const deleteFile = async (filepath) => {
    try {
        await fs.unlink(filepath);
    } catch (error) {
        console.warn('Failed to delete file:', error);
    }
};

module.exports = {
    extractTextFromBuffer,
    saveFile,
    deleteFile
};