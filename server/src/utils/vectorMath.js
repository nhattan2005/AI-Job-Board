function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, index) => sum + val * vecB[index], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return (dotProduct / (magnitudeA * magnitudeB)) * 100; // Return percentage
}

module.exports = {
    cosineSimilarity,
};