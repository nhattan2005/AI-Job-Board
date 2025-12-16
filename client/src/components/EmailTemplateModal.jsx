import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailTemplateModal = ({ isOpen, onClose, selectedApplicationIds = [], onSent }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSubject('');
            setMessage('');
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            setError('Please fill in both subject and message');
            return;
        }

        if (!selectedApplicationIds || selectedApplicationIds.length === 0) {
            setError('No candidates selected');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const response = await axios.post('/api/employer/send-bulk-email', {
                applicationIds: selectedApplicationIds,
                subject: subject,
                message: message
            });

            setSuccess(true);
            setTimeout(() => {
                onSent && onSent(response.data);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error sending emails:', err);
            setError(err.response?.data?.error || 'Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Send Email to Candidates</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Sending to {selectedApplicationIds?.length || 0} candidate{(selectedApplicationIds?.length || 0) !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={sending}
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Emails sent successfully!
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Interview Invitation for AI Engineer Position"
                                disabled={sending}
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={10}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Dear [Candidate Name],&#10;&#10;Thank you for your application...&#10;&#10;Best regards,&#10;[Your Company]"
                                disabled={sending}
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                💡 Tip: Use [Candidate Name] and it will be replaced with each candidate's name
                            </p>
                        </div>

                        {/* Quick Templates */}
                        <div className="border-t pt-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Quick Templates:</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setSubject('Interview Invitation');
                                        setMessage('Dear [Candidate Name],\n\nWe were impressed with your application and would like to invite you for an interview.\n\nPlease let us know your availability for next week.\n\nBest regards,\nHiring Team');
                                    }}
                                    className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm"
                                    disabled={sending}
                                >
                                    📅 Interview Invitation
                                </button>
                                <button
                                    onClick={() => {
                                        setSubject('Application Update');
                                        setMessage('Dear [Candidate Name],\n\nThank you for your interest in our position. We wanted to update you on the status of your application.\n\nWe are currently reviewing all applications and will get back to you soon.\n\nBest regards,\nHiring Team');
                                    }}
                                    className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition text-sm"
                                    disabled={sending}
                                >
                                    ✉️ Status Update
                                </button>
                                <button
                                    onClick={() => {
                                        setSubject('Congratulations - Job Offer');
                                        setMessage('Dear [Candidate Name],\n\nCongratulations! We are pleased to offer you the position.\n\nPlease review the attached offer letter and let us know if you have any questions.\n\nBest regards,\nHiring Team');
                                    }}
                                    className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-sm"
                                    disabled={sending}
                                >
                                    🎉 Job Offer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                        disabled={sending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !subject.trim() || !message.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {sending ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplateModal;