const pdfParse = require('pdf-parse');

/**
 * Extract text from PDF file buffer
 * @param {Object} file - Multer file object with buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = async (file) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Invalid file: missing buffer');
        }

        // Check if file is PDF
        const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

        if (!isPDF) {
            throw new Error('Only PDF files are supported');
        }

        // Parse PDF
        const data = await pdfParse(file.buffer);
        
        if (!data || !data.text) {
            throw new Error('Could not extract text from PDF');
        }

        return data.text.trim();
    } catch (error) {
        console.error('❌ PDF extraction error:', error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

module.exports = {
    extractTextFromFile
};