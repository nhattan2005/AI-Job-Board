const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCareerPath = async (cvText) => {
    try {
        console.log('Initializing Gemini model for career analysis...');
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        });

        const prompt = `You are an expert career counselor and HR consultant with deep knowledge of IT industry trends, salary benchmarks, and career development paths.

Analyze this CV and provide a comprehensive career path analysis.

CV:
${cvText.substring(0, 3000)}

IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text). Use this exact structure:

{
  "current_positioning": {
    "role": "Current or most recent job title",
    "level": "Junior/Mid-level/Senior/Lead",
    "salary_potential": "$XX,XXX - $XXX,XXX USD/year",
    "summary": "2-3 sentence summary of current career position"
  },
  "skill_gap": [
    {
      "skill": "Skill name",
      "status": "Missing or Weak",
      "priority": "High or Medium or Low"
    }
  ],
  "paths": [
    {
      "name": "Career path name (e.g., 'Senior Full-Stack Developer')",
      "match": 85,
      "time": "1-2 years",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"]
    }
  ],
  "roadmap": [
    {
      "phase": "0-3 Months",
      "actions": [
        {
          "type": "Learn or Project or Certification",
          "content": "Specific actionable task"
        }
      ]
    }
  ]
}

Guidelines:
- Provide 3-5 skill gaps
- Suggest 3-4 career paths with realistic match percentages (60-95%)
- Create a 12-month roadmap with 4 phases (0-3, 3-6, 6-9, 9-12 months)
- Each phase should have 3-5 specific, actionable tasks
- Be realistic about timelines and difficulty
- Consider current job market trends in IT

Respond with ONLY the JSON object, no other text.`;

        console.log('Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log('Received response from Gemini');

        // Clean up response - remove markdown if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON
        let careerPath;
        try {
            careerPath = JSON.parse(text);
            console.log('✓ JSON parsed successfully');
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            console.error('Raw response:', text.substring(0, 500));
            throw new Error('Invalid JSON response from AI. Please try again.');
        }

        // Validate structure
        if (!careerPath.current_positioning || !careerPath.skill_gap || 
            !careerPath.paths || !careerPath.roadmap) {
            throw new Error('Incomplete career path data from AI');
        }

        return careerPath;
    } catch (error) {
        console.error('❌ Career path generation error:', error);
        
        // Handle quota exceeded
        if (error.status === 429) {
            throw new Error('API quota exceeded. Please wait and try again.');
        }
        
        // Return fallback structure if AI fails
        return {
            current_positioning: {
                role: "Unable to analyze",
                level: "Unknown",
                salary_potential: "Unable to estimate",
                summary: "Could not analyze CV at this time. Please try again."
            },
            skill_gap: [
                {
                    skill: "Analysis unavailable",
                    status: "Unknown",
                    priority: "Unknown"
                }
            ],
            paths: [
                {
                    name: "Unable to suggest paths",
                    match: 0,
                    time: "Unknown",
                    pros: ["Please try again later"],
                    cons: ["AI service temporarily unavailable"]
                }
            ],
            roadmap: [
                {
                    phase: "Try Again",
                    actions: [
                        {
                            type: "Info",
                            content: "Career path analysis is temporarily unavailable. Please try again in a few moments."
                        }
                    ]
                }
            ]
        };
    }
};

module.exports = {
    generateCareerPath
};