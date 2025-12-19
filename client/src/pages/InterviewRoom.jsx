import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Sử dụng api service chuẩn của dự án

const InterviewRoom = () => {
    const { jobId, type } = useParams();
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState(null);
    const [jobDetails, setJobDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [questionCount, setQuestionCount] = useState(0); // THÊM DÒNG NÀY
    const [interviewCompleted, setInterviewCompleted] = useState(false); // THÊM DÒNG NÀY
    const messagesEndRef = useRef(null);

    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    // Tự động cuộn xuống cuối chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    // Khởi tạo session
    useEffect(() => {
        const initSession = async () => {
            try {
                const res = await api.post('/mock-interview/start', { jobId, type });
                setSessionId(res.data.sessionId);
                setJobDetails(res.data.jobDetails); // THÊM DÒNG NÀY
                setMessages([{ role: 'ai', text: res.data.message }]);
            } catch (err) {
                console.error(err);
                alert('Failed to start interview session.');
                navigate(`/jobs/${jobId}`);
            }
        };
        if (jobId && type) initSession();
    }, [jobId, type, navigate]);

    // Lấy thông tin chi tiết job
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const res = await api.get(`/jobs/${jobId}`);
                setJobDetails(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (jobId) fetchJobDetails();
    }, [jobId]);

    const handleSend = async () => {
        if (!transcript && !listening) return;
        
        SpeechRecognition.stopListening();
        const userText = transcript;
        if (!userText.trim()) return;

        // UI Update
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setProcessing(true);
        resetTranscript();

        try {
            const res = await api.post('/mock-interview/chat', {
                sessionId,
                userText,
                audioStats: { hesitations: 0 } // Placeholder logic
            });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const handleStartSpeaking = () => {
        if (processing) return; // Thêm dòng này để tránh xung đột
        setStartTime(Date.now());
        resetTranscript();
        SpeechRecognition.startListening({ 
            continuous: true,
            language: 'en-US'
        });
    };

    const handleStopSpeaking = async () => {
        SpeechRecognition.stopListening();
        
        if (!transcript.trim()) {
            alert('No speech detected. Please try again.');
            return;
        }

        const userText = transcript;
        const durationSec = startTime ? (Date.now() - startTime) / 1000 : 0;
        const words = userText.trim().split(/\s+/);
        const wpm = durationSec > 0 ? Math.round((words.length / durationSec) * 60) : 0;

        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setProcessing(true);
        resetTranscript();

        try {
            // Tăng số câu hỏi
            const newCount = questionCount + 1;
            setQuestionCount(newCount);

            // Nếu đã đủ 5 câu hỏi, yêu cầu AI kết thúc
            if (newCount >= 5) {
                const endPrompt = `${userText}\n\n[INTERVIEWER INSTRUCTION: This is the 5th question. After evaluating this answer, politely END the interview by saying: "That concludes our interview today. Thank you for your time. You'll receive detailed feedback via email within 24 hours."]`;
                
                const res = await api.post('/mock-interview/chat', {
                    sessionId,
                    userText: endPrompt,
                    audioStats: { wpm }
                });
                
                setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
                setInterviewCompleted(true);
                
                // Tự động chuyển sang trang feedback sau 3 giây
                setTimeout(() => {
                    navigate(`/interview/feedback/${sessionId}`);
                }, 3000);
            } else {
                const res = await api.post('/mock-interview/chat', {
                    sessionId,
                    userText,
                    audioStats: { wpm }
                });
                setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setProcessing(false);
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return <div className="p-10 text-center">Browser does not support speech recognition.</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 pt-16">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 shadow-sm z-30 fixed top-16 left-0 right-0">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">AI Mock Interview</h1>
                        {jobDetails && (
                            <p className="text-sm text-slate-600 mt-1">
                                <span className="font-semibold">{jobDetails.title}</span> at {jobDetails.company} • {jobDetails.location} • {type === 'HR' ? '👤 HR Round' : '💻 Technical Round'}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>Question {questionCount}/5</span>
                            {questionCount >= 5 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">Complete</span>}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to end this interview? Your progress will be saved.')) {
                                navigate(`/interview/feedback/${sessionId}`);
                            }
                        }} 
                        disabled={interviewCompleted}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg border border-red-200 transition disabled:opacity-50"
                    >
                        End Interview
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {processing && <div className="text-slate-400 text-sm italic ml-4">AI is thinking...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="bg-white border-t p-6">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
                    <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px] text-slate-700">
                        {transcript || "Press the microphone to start speaking..."}
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={listening ? handleSend : handleStartSpeaking}
                            className={`px-8 py-3 rounded-full font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                                listening 
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {listening ? (
                                <>⏹ Stop & Send</>
                            ) : (
                                <>🎤 Start Speaking</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewRoom;