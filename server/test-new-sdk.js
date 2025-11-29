const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testNewSDK() {
    console.log('Testing with new SDK setup...\n');
    
    // Test text generation
    try {
        console.log('1. Testing gemini-1.5-flash for text generation...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello in one word');
        const response = await result.response;
        console.log('✅ Text generation works!');
        console.log('Response:', response.text());
        console.log();
    } catch (error) {
        console.log('❌ Text generation failed:', error.message);
        console.log();
    }
    
    // Test embedding
    try {
        console.log('2. Testing text-embedding-004 for embeddings...');
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent('Hello world');
        console.log('✅ Embedding works!');
        console.log('Embedding dimensions:', result.embedding.values.length);
        console.log();
    } catch (error) {
        console.log('❌ Embedding failed:', error.message);
        console.log();
    }
}

testNewSDK();