const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAllModels() {
    console.log('Testing all possible Gemini models...\n');
    
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro',
        'gemini-pro-vision',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'models/gemini-pro'
    ];
    
    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello in one word');
            const response = await result.response;
            console.log(`✅ ${modelName} works!`);
            console.log(`Response: ${response.text()}\n`);
            break; // Stop at first working model
        } catch (error) {
            console.log(`❌ ${modelName} failed: ${error.message}\n`);
        }
    }
}

testAllModels();