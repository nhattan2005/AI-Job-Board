import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import api from '../services/api';

const PracticeInterviewRoom = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [interviewCompleted, setInterviewCompleted] = useState(false);
    const [inputMode, setInputMode] = useState('voice');
    const [textInput, setTextInput] = useState('');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null); // 👈 THÊM: Ref cho chat container
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // 👇 SỬA: Auto scroll CHỈ trong chat container (không kéo xuống footer)
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, processing]);

    // Load session history
    useEffect(() => {
        const loadSession = async () => {
            try {
                const response = await api.get(`/mock-interview/session/${sessionId}`);
                if (response.data.chat_history && response.data.chat_history.length > 0) {
                    const history = response.data.chat_history;
                    const formattedMessages = history.map(msg => ({
                        role: msg.role === 'model' ? 'ai' : 'user',
                        text: msg.parts?.[0]?.text || msg.text || ''
                    }));
                    setMessages(formattedMessages);
                    setQuestionCount(history.filter(m => m.role === 'user').length);
                }
            } catch (err) {
                console.error('Failed to load session:', err);
            }
        };
        if (sessionId) {
            loadSession();
        }
    }, [sessionId]);

    // 👇 XÓA: Không tự động bật mic nữa
    // useEffect(() => {
    //     if (!listening && inputMode === 'voice' && !processing && messages.length > 0) {
    //         ...
    //     }
    // }, [listening, processing, inputMode, messages.length]);

    // 👇 SỬA: Chỉ bật mic khi user bấm "Start Speaking"
    const handleStartSpeaking = () => {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    };

    // 👇 SỬA: Stop & Send khi user bấm nút
    const handleStopAndSend = async () => {
        SpeechRecognition.stopListening();
        
        const userText = transcript.trim();
        if (!userText) {
            alert('No speech detected. Please try speaking again.');
            return;
        }

        await sendMessage(userText);
        resetTranscript();
    };

    const handleSendText = async () => {
        const userText = textInput.trim();
        if (!userText) {
            alert('Please type something');
            return;
        }

        await sendMessage(userText);
        setTextInput('');
    };

    // 👇 TÁCH RA: Logic gửi message
    const sendMessage = async (userText) => {
        setProcessing(true);
        setMessages(prev => [...prev, { role: 'user', text: userText }]);

        try {
            const res = await api.post('/mock-interview/chat', {
                sessionId,
                userText,
                audioStats: { wpm: 0 }
            });
            
            if (res.data.message) {
                setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
            }

            if (res.data.questionsAsked !== undefined) {
                setQuestionCount(res.data.questionsAsked);
            }

            if (res.data.questionsAsked >= 5) {
                setInterviewCompleted(true);
                setTimeout(() => {
                    navigate(`/interview/feedback/${sessionId}`);
                }, 3000);
            }

        } catch (err) {
            console.error('Chat error:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // 👇 THÊM HÀM: Format text với *bold*
    const formatMessage = (text) => {
        if (!text) return '';
        
        // Split text theo pattern *text*
        const parts = text.split(/(\*[^*]+\*)/g);
        
        return parts.map((part, i) => {
            // Nếu part bắt đầu và kết thúc bằng *, render bold
            if (part.startsWith('*') && part.endsWith('*')) {
                const innerText = part.slice(1, -1); // Bỏ dấu *
                return <strong key={i} className="font-bold">{innerText}</strong>;
            }
            // Text thường
            return <span key={i}>{part}</span>;
        });
    };

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-4">
                        Your browser doesn't support speech recognition.
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
            <div className="bg-white border-b px-6 py-4 shadow-sm flex-shrink-0">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Practice Interview</h1>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>Question {questionCount}/5</span>
                            {questionCount >= 5 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">Complete</span>}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm('End interview and get feedback?')) {
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

            {/* 👇 SỬA: Chat Area */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50"
                style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p className="font-bold text-lg">Loading interview...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl shadow-md ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-slate-800 border border-slate-200'
                                }`}>
                                    {/* 👇 SỬA: Format message với bold */}
                                    <p className="whitespace-pre-wrap">
                                        {msg.role === 'ai' ? formatMessage(msg.text) : msg.text}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {processing && (
                            <div className="flex justify-start">
                                <div className="bg-white text-slate-800 border border-slate-200 p-4 rounded-2xl shadow-md">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <span className="text-sm text-slate-500">AI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 👇 SỬA: Controls - STICKY BOTTOM */}
            <div className="bg-white border-t p-4 shadow-lg flex-shrink-0 sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="w-full flex justify-center gap-2 mb-2">
                        <button
                            onClick={() => {
                                setInputMode('voice');
                                if (listening) {
                                    SpeechRecognition.stopListening();
                                    resetTranscript();
                                }
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                inputMode === 'voice' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            🎤 Voice
                        </button>
                        <button
                            onClick={() => {
                                setInputMode('text');
                                if (listening) {
                                    SpeechRecognition.stopListening();
                                    resetTranscript();
                                }
                            }}
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
                            {listening ? (
                                <div className="text-sm text-blue-600 mb-2 font-semibold animate-pulse flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></div>
                                    Recording... Speak clearly
                                </div>
                            ) : (
                                <div className="text-sm text-slate-400 mb-2">
                                    Press "Start Speaking" when you're ready
                                </div>
                            )}
                            <div className="text-slate-700">
                                {transcript || "Your speech will appear here..."}
                            </div>
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
                            <>
                                {!listening ? (
                                    <button 
                                        onClick={handleStartSpeaking}
                                        disabled={processing}
                                        className={`px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                                            processing
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        🎤 Start Speaking
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleStopAndSend}
                                        disabled={processing}
                                        className="px-6 py-2.5 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 animate-pulse"
                                    >
                                        ⏹ Stop & Send
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleSendText}
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

export default PracticeInterviewRoom;