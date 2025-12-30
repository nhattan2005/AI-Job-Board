const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from uploaded file (PDF, DOCX, TXT)
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = async (file) => {
    if (!file || !file.buffer) {
        throw new Error('Invalid file data');
    }

    const { buffer, mimetype } = file;

    try {
        // 1. Text File
        if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        } 
        // 2. PDF File
        else if (mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            return pdfData.text;
        }
        // 3. Word File (DOCX)
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        else {
            throw new Error('Unsupported file type. Only PDF, DOCX, and TXT are supported.');
        }
    } catch (error) {
        console.error('❌ Error extracting text:', error.message);
        throw new Error('Failed to extract text// filepath: server/src/utils/textExtractor.js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from uploaded file (PDF, DOCX, TXT)
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = async (file) => {
    if (!file || !file.buffer) {
        throw new Error('Invalid file data');
    }

    const { buffer, mimetype } = file;

    try {
        // 1. Text File
        if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        } 
        // 2. PDF File
        else if (mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            return pdfData.text;
        }
        // 3. Word File (DOCX)
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        else {
            throw new Error('Unsupported file type. Only PDF, DOCX, and TXT are supported.');
        }
    } catch (error) {
        console.error('❌ Error extracting text:', error.message);
        throw new Error('Failed to extract text from file: ' + error.message);
}
};

module.exports = { extractTextFromFile };