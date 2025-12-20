const { Gemini } = require('google-generative-ai');

const gemini = new Gemini({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-flash-latest',
});

module.exports = gemini;