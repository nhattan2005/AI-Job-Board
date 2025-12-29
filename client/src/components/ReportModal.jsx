import React, { useState } from 'react';
import api from '../services/api';

const ReportModal = ({ isOpen, onClose, targetType, targetId, targetName }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reports', {
                target_type: targetType,
                target_id: targetId,
                reason,
                description
            });
            alert('Report submitted successfully. Admins will review it shortly.');
            onClose();
            setReason('');
            setDescription('');
        } catch (error) {
            alert('Failed to submit report.');
        } finally {
            setLoading(false);
        }
    };

    const reasons = targetType === 'job' 
        ? ['Scam/Fake Job', 'Inappropriate Content', 'Expired Job', 'Wrong Information', 'Other']
        : ['Fake Profile', 'Harassment', 'Spam', 'Inappropriate Content', 'Other'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report {targetType === 'job' ? 'Job' : 'User'}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    Reporting: <strong>{targetName}</strong>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select a reason</option>
                            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
                            rows="4"
                            placeholder="Please provide more details..."
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;