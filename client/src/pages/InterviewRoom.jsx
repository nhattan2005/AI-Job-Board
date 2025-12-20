import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import api from '../services/api';

const InterviewRoom = () => {
    const { jobId, type } = useParams();
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState(null);
    const [jobDetails, setJobDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [interviewCompleted, setInterviewCompleted] = useState(false);
    const [inputMode, setInputMode] = useState('voice');
    const [textInput, setTextInput] = useState('');
    const messagesEndRef = useRef(null);
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Tự động cuộn xuống cuối chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    // Khởi tạo session
    useEffect(() => {
        let isMounted = true;
        
        const initSession = async () => {
            if (sessionId) {
                console.log('⚠️ Session already exists, skipping init');
                return;
            }
            
            try {
                console.log('🚀 Sending POST /mock-interview/start', { jobId, type });
                
                const res = await api.post('/mock-interview/start', { jobId, type });
                
                console.log('✅ Response received:', {
                    sessionId: res.data.sessionId,
                    message: res.data.message,
                    jobDetails: res.data.jobDetails
                });
                
                if (isMounted) {
                    setSessionId(res.data.sessionId);
                    setJobDetails(res.data.jobDetails);
                    setMessages([{ role: 'ai', text: res.data.message }]);
                    setQuestionCount(1);
                    
                    console.log('✅ State updated successfully');
                }
            } catch (err) {
                console.error('❌ Init session error:', err.response || err);
                if (isMounted) {
                    alert(`Failed to start interview: ${err.response?.data?.details || err.message}`);
                    navigate(`/jobs/${jobId}`);
                }
            }
        };
        
        if (jobId && type && !sessionId) {
            initSession();
        }
        
        return () => {
            isMounted = false;
        };
    }, [jobId, type]);

    // Debug log
    useEffect(() => {
        console.log('🔍 Messages state changed:', messages);
    }, [messages]);

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            if (listening) {
                SpeechRecognition.stopListening();
            }
        };
    }, [listening]);

    // Bắt đầu nói
    const handleStartSpeaking = () => {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    };

    // Handle send
    const handleSend = async () => {
        let userText;
        
        if (inputMode === 'voice') {
            if (listening) {
                SpeechRecognition.stopListening();
            }
            userText = transcript.trim();
            if (!userText) {
                alert('No speech detected. Please try again.');
                return;
            }
        } else {
            userText = textInput.trim();
            if (!userText) {
                alert('Please enter your answer');
                return;
            }
        }
        
        console.log('📝 User input:', userText);

        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setProcessing(true);
        
        if (inputMode === 'voice') {
            resetTranscript();
        } else {
            setTextInput('');
        }

        try {
            console.log('📤 Sending to backend:', { sessionId, userText });
            
            const res = await api.post('/mock-interview/chat', {
                sessionId,
                userText,
                audioStats: { wpm: 0 }
            });
            
            console.log('✅ Backend response:', res.data);
            
            if (!res.data.message || res.data.message.trim() === '') {
                console.error('❌ Empty message from backend!');
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: 'Sorry, I encountered an error. Please try again.' 
                }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
            }

            // Cập nhật question count
            if (res.data.questionsAsked !== undefined) {
                console.log('📊 Questions asked:', res.data.questionsAsked);
                setQuestionCount(res.data.questionsAsked);
            }

            // Kiểm tra xem đã hết 5 câu hỏi chưa
            if (res.data.questionsAsked >= 5) {
                setInterviewCompleted(true);
                setTimeout(() => {
                    navigate(`/interview/feedback/${sessionId}`);
                }, 3000);
            }
        } catch (err) {
            console.error('❌ Send error:', err);
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: 'Sorry, I encountered an error. Please try again.' 
            }]);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (!browserSupportsSpeechRecognition) return;

        // Auto-restart khi bị ngắt
        SpeechRecognition.getRecognition().onend = () => {
            if (listening && !processing) {
                console.log('🔄 Auto-restarting speech recognition...');
                setTimeout(() => {
                    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
                }, 500);
            }
        };

        // Error handling
        SpeechRecognition.getRecognition().onerror = (event) => {
            console.error('🎤 Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                console.log('⚠️ No speech detected, restarting...');
            }
        };
    }, [listening, processing, browserSupportsSpeechRecognition]);

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-4">
                        Your browser doesn't support speech recognition.
                    </p>
                    <p className="text-gray-600 mb-4">
                        Please use Google Chrome or Microsoft Edge, or switch to Text mode.
                    </p>
                    <button
                        onClick={() => setInputMode('text')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                    >
                        Switch to Text Mode
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 shadow-sm">
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 min-h-[400px]">
                {console.log('🔍 Rendering Chat Area - Messages:', messages)}
                
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                        <p className="font-bold text-lg">⚠️ No messages yet</p>
                        <p className="text-sm mt-2">Waiting for AI to start interview...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white border-2 border-slate-300 text-slate-800 rounded-bl-none'
                                }`}>
                                    <div className="text-xs font-semibold mb-1 opacity-70">
                                        {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                                    </div>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {processing && (
                    <div className="text-slate-400 text-sm italic ml-4 flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></div>
                        AI is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="bg-white border-t p-4 shadow-lg">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="w-full flex justify-center gap-2 mb-2">
                        <button
                            onClick={() => setInputMode('voice')}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                inputMode === 'voice' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            🎤 Voice
                        </button>
                        <button
                            onClick={() => setInputMode('text')}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                inputMode === 'text' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            ⌨️ Text
                        </button>
                    </div>

                    {/* Input Area */}
                    {inputMode === 'voice' ? (
                        <div className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px] text-slate-700">
                            {listening && (
                                <div className="text-sm text-blue-600 mb-2 font-semibold animate-pulse flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></div>
                                    Recording... Speak clearly
                                </div>
                            )}
                            {transcript || "Press 'Start Speaking' to begin..."}
                        </div>
                    ) : (
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type your answer here..."
                            rows="4"
                            className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            disabled={processing}
                        />
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full justify-center">
                        {inputMode === 'voice' ? (
                            <button 
                                onClick={listening ? handleSend : handleStartSpeaking}
                                disabled={processing}
                                className={`px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                                    listening 
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                    : processing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {listening ? (
                                    <>⏹ Stop & Send</>
                                ) : processing ? (
                                    <>⏳ Processing...</>
                                ) : (
                                    <>🎤 Start Speaking</>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={processing || !textInput.trim()}
                                className={`px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                                    processing || !textInput.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>📤 Send Answer</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewRoom;