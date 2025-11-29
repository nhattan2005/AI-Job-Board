// This file contains the logic for calculating the matching score between job descriptions and CVs using cosine similarity.

const { cosineSimilarity } = require('../utils/vectorMath');
const db = require('../config/database');

// Function to get the matching score between a job and a CV
const getMatchingScore = async (jobId, cvVector) => {
    try {
        const job = await db.query('SELECT id, vector FROM jobs WHERE id = $1', [jobId]);
        
        if (job.rows.length === 0) {
            throw new Error('Job not found');
        }

        const jobVector = JSON.parse(job.rows[0].vector);
        const score = cosineSimilarity(jobVector, cvVector);

        return {
            jobId: jobId,
            matchingScore: score
        };
    } catch (error) {
        throw new Error(`Error calculating matching score: ${error.message}`);
    }
};

module.exports = {
    getMatchingScore
};