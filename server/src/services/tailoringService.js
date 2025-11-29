const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tailorCV = async (cvText, jobDescription) => {
    const prompt = `You are an expert CV consultant. Analyze the following CV against the job description and provide specific, actionable suggestions.

Job Description:
${jobDescription}

CV:
${cvText}

Please provide your analysis in the following JSON format (output ONLY valid JSON, no markdown):
{
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "missingSkills": ["skill1", "skill2", "skill3"],
  "suggestions": [
    "Suggestion 1: Add more specific examples of your achievements",
    "Suggestion 2: Quantify your results with numbers and metrics",
    "Suggestion 3: Highlight relevant technologies mentioned in the job description"
  ],
  "improvements": [
    "Improvement 1: Restructure experience section to emphasize relevant roles",
    "Improvement 2: Add a summary section that mirrors job requirements",
    "Improvement 3: Use action verbs and industry-specific terminology"
  ]
}`;

    try {
        // Use gemini-2.5-flash (your available model)
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.95,
                topK: 40,
            }
        });
        
        console.log('Using model: gemini-2.5-flash for CV tailoring');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Gemini Response received, length:', text.length);
        
        // Remove markdown code blocks if present
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/```json\n?/g, '');
        cleanedText = cleanedText.replace(/```\n?/g, '');
        cleanedText = cleanedText.trim();
        
        // Try to parse JSON from the cleaned response
        try {
            const parsed = JSON.parse(cleanedText);
            console.log('Successfully parsed AI response');
            return parsed;
        } catch (firstParseError) {
            console.warn('Direct JSON parse failed, trying regex extraction');
            
            // Try to extract JSON using regex
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('Successfully extracted and parsed JSON from response');
                    return parsed;
                } catch (regexParseError) {
                    console.warn('Regex extraction parse failed');
                }
            }
        }
        
        // If all parsing fails, create structured response from text
        console.warn('Could not parse JSON, creating fallback response');
        return createFallbackResponse(text, cvText, jobDescription);
        
    } catch (error) {
        console.error('Error tailoring CV:', error);
        
        if (error.status === 429 || error.message.includes('quota')) {
            throw new Error('API quota exceeded. Please wait a moment and try again, or upgrade your API plan.');
        }
        
        if (error.status === 404) {
            throw new Error('Model gemini-2.5-flash not available. Please check your API configuration.');
        }
        
        if (error.status === 403) {
            throw new Error('API access denied. Please verify your API key has the correct permissions.');
        }
        
        throw new Error('Could not tailor CV: ' + error.message);
    }
};

// Fallback function to create structured response
const createFallbackResponse = (text, cvText, jobDescription) => {
    console.log('Creating fallback response from text analysis');
    
    const jobKeywords = extractKeywords(jobDescription);
    const cvKeywords = extractKeywords(cvText);
    
    // Find missing keywords
    const missingKeywords = jobKeywords.filter(keyword => 
        !cvKeywords.some(cvKeyword => 
            cvKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
    ).slice(0, 10);
    
    // Extract technical skills
    const techSkills = extractTechSkills(jobDescription);
    const missingSkills = techSkills.filter(skill => 
        !cvText.toLowerCase().includes(skill.toLowerCase())
    ).slice(0, 8);
    
    // Parse suggestions from text if available
    const suggestions = [];
    const improvements = [];
    
    // Try to extract suggestions from the raw text
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
        if (line.match(/^\d+\./)) {
            suggestions.push(line.replace(/^\d+\.\s*/, ''));
        } else if (line.match(/^-\s+/)) {
            improvements.push(line.replace(/^-\s+/, ''));
        }
    }
    
    // Default suggestions if none extracted
    if (suggestions.length === 0) {
        suggestions.push(
            text || `Your CV is missing ${missingKeywords.length} key terms from the job description. Consider incorporating: ${missingKeywords.slice(0, 5).join(', ')}`,
            "Add quantifiable achievements with specific numbers and metrics (e.g., 'Increased performance by 40%')",
            "Include relevant technical skills and certifications mentioned in the job posting",
            "Use action verbs at the start of bullet points (e.g., 'Developed', 'Implemented', 'Led')",
            "Tailor your professional summary to directly address the job requirements"
        );
    }
    
    if (improvements.length === 0) {
        improvements.push(
            "Restructure your CV to emphasize the most relevant experience first",
            `Highlight experience with: ${missingSkills.length > 0 ? missingSkills.slice(0, 3).join(', ') : 'the key technologies mentioned'}`,
            "Add a skills section that mirrors the technical requirements",
            "Include metrics and KPIs to demonstrate your impact in previous roles",
            "Use industry-specific terminology from the job description"
        );
    }
    
    return {
        missingKeywords: missingKeywords,
        missingSkills: missingSkills,
        suggestions: suggestions.slice(0, 5),
        improvements: improvements.slice(0, 5)
    };
};

// Helper function to extract keywords
const extractKeywords = (text) => {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'your', 'our', 'their', 'from', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
        'same', 'than', 'too', 'very', 'you', 'we', 'they', 'them', 'us'
    ]);
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));
    
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
};

// Extract technical skills from text
const extractTechSkills = (text) => {
    const commonTechSkills = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'kotlin', 'swift',
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'node', 'express', 'fastify', 'nest.js',
        'django', 'flask', 'fastapi', 'spring', 'spring boot', 'laravel', 'rails', 'asp.net',
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'oracle',
        'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'vercel', 'netlify',
        'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible',
        'git', 'github', 'gitlab', 'bitbucket', 'rest', 'restful', 'graphql', 'grpc', 'soap',
        'api', 'microservices', 'serverless', 'lambda', 'agile', 'scrum', 'kanban', 'jira',
        'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'bootstrap', 'material-ui',
        'webpack', 'vite', 'rollup', 'parcel', 'babel', 'eslint', 'prettier',
        'sql', 'nosql', 'orm', 'sequelize', 'prisma', 'typeorm', 'mongoose',
        'kafka', 'rabbitmq', 'redis', 'memcached', 'nginx', 'apache',
        'linux', 'unix', 'bash', 'shell', 'powershell', 'ci/cd', 'devops', 'sre',
        'machine learning', 'ml', 'ai', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
        'data science', 'pandas', 'numpy', 'matplotlib', 'jupyter',
        'testing', 'jest', 'mocha', 'cypress', 'selenium', 'puppeteer', 'junit', 'pytest',
        'oauth', 'jwt', 'saml', 'ldap', 'authentication', 'authorization', 'security'
    ];
    
    const textLower = text.toLowerCase();
    return commonTechSkills.filter(skill => textLower.includes(skill));
};

module.exports = {
    tailorCV,
};