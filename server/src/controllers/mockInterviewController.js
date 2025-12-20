const db = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: Timeout wrapper
const withTimeout = (promise, timeoutMs = 30000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout after ' + timeoutMs + 'ms')), timeoutMs)
        )
    ]);
};

// 1. Start Session
const startSession = async (req, res) => {
    const { jobId, type } = req.body; // type: 'HR' or 'Tech_Lead'
    const userId = req.user.id;

    try {
        if (!jobId || !type) {
            return res.status(400).json({ error: 'Missing jobId or type' });
        }

        if (!['HR', 'Tech_Lead'].includes(type)) {
            return res.status(400).json({ error: 'Invalid interview type' });
        }

        // Debouncing check
        const recentCheck = await db.query(
            'SELECT session_id FROM mock_interviews WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'5 seconds\'', // ← ĐỔI 10 THÀNH 5
            [userId]
        );
        
        if (recentCheck.rows.length > 0) {
            return res.status(429).json({ 
                error: 'Too many requests',
                details: 'Please wait 5 seconds before starting a new interview.' // ← ĐỔI 10 THÀNH 5
            });
        }

        console.log(`🎤 Starting ${type} interview for job ${jobId} by user ${userId}`);

        // Lấy thông tin Job và Candidate
        const [jobRes, userRes] = await Promise.all([
            db.query(
                'SELECT j.title, j.description, j.location, u.company_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE j.id = $1', 
                [jobId]
            ),
            db.query(
                'SELECT full_name FROM users WHERE id = $1',
                [userId]
            )
        ]);

        if (jobRes.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const job = jobRes.rows[0];
        const candidateName = userRes.rows[0]?.full_name || 'Candidate';
        console.log(`✅ Job found: ${job.title}`);
        console.log(`✅ Candidate: ${candidateName}`);

        // Tạo Session trong DB (FIX: Truyền chuỗi JSON thay vì dùng ::jsonb)
        const insertRes = await db.query(
            `INSERT INTO mock_interviews (user_id, job_id, interview_type, chat_history) 
             VALUES ($1, $2, $3, $4) RETURNING session_id`,
            [userId, jobId, type, JSON.stringify([])] // ← SỬA ĐÂY
        );
        const sessionId = insertRes.rows[0].session_id;
        console.log(`✅ Session created: ${sessionId}`);

        // Gọi Gemini để tạo câu hỏi đầu tiên
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        // System Prompt động dựa vào interview type
        const interviewerRole = type === 'HR' ? 'an HR interviewer' : 'a Tech Lead';

        let focusArea = '';
        if (type === 'Tech_Lead') {
            focusArea = `
TECHNICAL FOCUS:
- System design and architecture decisions
- Code quality, testing strategies, and CI/CD
- Scalability and performance optimization
- Technical trade-offs in AI/ML projects
`;
        } else {
            focusArea = `
HR FOCUS:
- Behavioral questions using STAR method (Situation, Task, Action, Result)
- Teamwork, conflict resolution, and communication skills
- Motivation, career goals, and cultural fit
- Work-life balance and stress management
`;
        }

        const systemPrompt = `You are a professional ${type} interviewer at ${job.company_name}. 
Position: ${job.title} in ${job.location}.

Job Description (first 600 chars):
${job.description.substring(0, 600)}

${focusArea}

INTERVIEW STRUCTURE:
1. Introduce yourself: "Hello ${candidateName}, I'm ${interviewerRole} at ${job.company_name}."
2. Ask ONE clear, specific question related to the job description.
3. Keep your responses under 2 sentences.
4. Ask a total of 5 questions, then politely end the interview.

IMPORTANT RULES:
- If the candidate's answer is incomplete or too short, politely ask them to elaborate: "Could you provide more details on that?"
- After receiving a satisfactory answer, immediately ask the next question.
- Do NOT repeat the same question.
- Do NOT ask more than 5 questions total.

START now with your introduction and Question 1.`;

        console.log("📤 Sending request to Gemini API...");

        const result = await withTimeout(
            model.generateContent(systemPrompt),
            30000
        );

        const firstQuestion = result.response.text();
        console.log("✅ Gemini response received:", firstQuestion.substring(0, 100) + '...'); // Log 100 ký tự đầu

        const initialHistory = [
            { role: 'user', parts: [{ text: 'Start the interview' }] },
            { role: 'model', parts: [{ text: firstQuestion }] }
        ];

        await db.query('UPDATE mock_interviews SET chat_history = $1 WHERE session_id = $2', 
            [JSON.stringify(initialHistory), sessionId]);

        const responseData = { 
            sessionId, 
            message: firstQuestion,
            jobDetails: {
                title: job.title,
                company: job.company_name,
                location: job.location
            }
        };

        console.log("📤 Sending response to client:", {
            sessionId,
            messageLength: firstQuestion.length,
            jobTitle: job.title
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Start Session Error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Request timeout',
                details: 'Gemini API took too long. Please try again.'
            });
        }
        
        if (error.status === 429 || error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait before trying again.'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to start session', 
            details: error.message 
        });
    }
};

// 2. Process Response
const processResponse = async (req, res) => {
    const { sessionId, userText, audioStats } = req.body;

    try {
        const sessionRes = await db.query('SELECT * FROM mock_interviews WHERE session_id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const session = sessionRes.rows[0];
        let history = session.chat_history || [];

        // Đếm số câu hỏi đã hỏi (đếm user messages thay vì model messages)
        const questionsAsked = history.filter(msg => msg.role === 'user').length;
        
        console.log(`📊 Questions asked so far: ${questionsAsked}`);
        
        // Chat với Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); // ← SỬA ĐÂY
        
        // Instruction động
        let additionalInstruction = '';
        if (questionsAsked >= 5) {
            additionalInstruction = '\n\n[SYSTEM: This was the 5th question. End the interview politely: "Thank you for your time today. You will receive feedback soon."]';
        } else if (userText.split(' ').length < 10) {
            additionalInstruction = '\n\n[SYSTEM: Answer was brief. Ask them to elaborate, then ask question ' + (questionsAsked + 1) + '. COMPLETE YOUR FULL SENTENCE.]';
        } else {
            additionalInstruction = `\n\n[SYSTEM: Good answer. Ask question ${questionsAsked + 1} now. COMPLETE YOUR FULL SENTENCE BEFORE STOPPING.]`;
        }

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 500, // ← TĂNG TỪ 300
                temperature: 0.7,
                stopSequences: [] // ← Không có stop sequence
            }
        });

        console.log('📤 Sending message to Gemini:', userText.substring(0, 50) + '...');
        
        const result = await withTimeout(
            chat.sendMessage(userText + additionalInstruction),
            20000 // ← Timeout 20 giây
        );
        
        let aiResponse = result.response.text().trim();
        
        console.log('✅ Raw AI Response:', aiResponse);
        
        // Kiểm tra response bị cắt ngang
        const truncatedEndings = ['However', 'But', 'And', 'Therefore', ',', ';'];
        const lastWord = aiResponse.split(' ').pop();
        
        if (truncatedEndings.includes(lastWord) || aiResponse.length < 30) {
            console.warn('⚠️ Response seems truncated, retrying with continuation prompt...');
            
            try {
                const continuePrompt = '[SYSTEM: Your previous response was incomplete. Continue from where you left off and complete your full thought.]';
                const retryResult = await withTimeout(
                    chat.sendMessage(continuePrompt),
                    15000
                );
                const continuation = retryResult.response.text().trim();
                aiResponse = aiResponse + ' ' + continuation;
                console.log('✅ Continued Response:', continuation);
            } catch (retryError) {
                console.error('❌ Retry failed:', retryError.message);
                // Nếu retry thất bại, thêm ending mặc định
                aiResponse += ' Could you elaborate on that?';
            }
        }

        // Cập nhật lịch sử
        const newHistory = [
            ...history,
            { role: 'user', parts: [{ text: userText }] },
            { role: 'model', parts: [{ text: aiResponse }] }
        ];

        // Cập nhật metrics
        const currentMetrics = session.audio_metrics || { hesitations: 0, wpm_history: [] };
        if (audioStats) {
            currentMetrics.hesitations = (currentMetrics.hesitations || 0) + (audioStats.hesitations || 0);
            if (audioStats.wpm) {
                currentMetrics.wpm_history = [...(currentMetrics.wpm_history || []), audioStats.wpm];
            }
        }

        await db.query(
            'UPDATE mock_interviews SET chat_history = $1, audio_metrics = $2 WHERE session_id = $3',
            [JSON.stringify(newHistory), JSON.stringify(currentMetrics), sessionId]
        );

        res.json({ 
            message: aiResponse,
            questionsAsked: questionsAsked + 1 // ← Trả về số câu hỏi hiện tại
        });
    } catch (error) {
        console.error('❌ Process Response Error:', error);
        
        if (error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Request timeout',
                details: 'AI took too long to respond. Please try again.'
            });
        }
        
        res.status(500).json({ error: 'Processing failed', details: error.message });
    }
};

// 3. End Session & Generate Feedback
const endSession = async (req, res) => {
    const { sessionId } = req.body;

    try {
        const sessionRes = await db.query('SELECT * FROM mock_interviews WHERE session_id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const session = sessionRes.rows[0];
        const history = session.chat_history || [];

        // Chuẩn bị context đầy đủ cho Gemini
        const conversationSummary = history.map(msg => {
            const role = msg.role === 'user' ? 'Candidate' : 'Interviewer';
            return `${role}: ${msg.parts[0].text}`;
        }).join('\n\n');

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `You are an expert interview evaluator. Analyze this ${session.interview_type} interview conversation and provide a comprehensive feedback report.

Interview Transcript:
${conversationSummary}

Audio Metrics:
- Hesitations: ${session.audio_metrics?.hesitations || 0}
- Average WPM: ${session.audio_metrics?.wpm_history?.length > 0 ? Math.round(session.audio_metrics.wpm_history.reduce((a,b) => a+b, 0) / session.audio_metrics.wpm_history.length) : 'N/A'}

Provide feedback in STRICT JSON format:
{
  "overall_score": 0-100,
  "strengths": ["Specific strength with evidence from transcript", "..."],
  "weaknesses": ["Specific area for improvement with example", "..."],
  "recommendation": "Hire" | "No Hire" | "Maybe"
}

Evaluation Criteria:
- Technical depth (for Tech_Lead) or behavioral quality (for HR)
- Communication clarity and structure
- Relevance to job requirements
- Problem-solving approach
- Professionalism

Return ONLY the JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json|```/g, '').trim();
        
        const report = JSON.parse(text);

        // Lưu vào DB
        await db.query(
            `UPDATE mock_interviews SET status = 'completed', overall_score = $1, final_feedback = $2 
             WHERE session_id = $3`,
            [report.overall_score, JSON.stringify(report), sessionId]
        );

        res.json(report);
    } catch (error) {
        console.error('End Session Error:', error);
        res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
    }
};

module.exports = { startSession, processResponse, endSession };