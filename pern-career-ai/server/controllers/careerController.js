const { Gemini } = require('google-generative-ai');

const gemini = new Gemini({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-flash-latest',
});

class CareerController {
  async generateCareerPath(req, res) {
    const { cvText } = req.body;

    const systemInstruction = {
      prompt: `Analyze the following CV and provide a JSON response with the structure: {
        "current_positioning": { "role": "", "level": "", "salary_potential": "", "summary": "" },
        "skill_gap": [ { "skill": "", "status": "Missing/Weak", "priority": "High" } ],
        "paths": [ { "name": "", "match": 0-100, "time": "", "pros": [], "cons": [] } ],
        "roadmap": [ { "phase": "0-3 Months", "actions": [ { "type": "Learn/Project", "content": "" } ] } ]
      }. Return ONLY JSON, no markdown.`,
      inputs: { cvText },
    };

    try {
      const response = await gemini.generate(systemInstruction);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Error generating career path' });
    }
  }
}

module.exports = new CareerController();