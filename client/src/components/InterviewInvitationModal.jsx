import React, { useState } from 'react';
import InterviewCalendar from './InterviewCalendar';
import api from '../services/api';

const InterviewInvitationModal = ({ isOpen, onClose, application, jobTitle, onSent }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [location, setLocation] = useState('Online');
    const [meetingLink, setMeetingLink] = useState('');
    // 👇 THÊM: State cho địa chỉ văn phòng
    const [officeAddress, setOfficeAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [duration, setDuration] = useState(60);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [newSlotDate, setNewSlotDate] = useState('');
    const [newSlotTime, setNewSlotTime] = useState('');

    const addTimeSlot = () => {
        if (!newSlotDate || !newSlotTime) {
            setError('Please select both date and time');
            return;
        }
        
        const slotDateTime = new Date(`${newSlotDate}T${newSlotTime}`);
        
        if (slotDateTime < new Date()) {
            setError('Please select a future date and time');
            return;
        }

        const slotString = slotDateTime.toISOString();
        if (timeSlots.includes(slotString)) {
            setError('This time slot already exists');
            return;
        }

        setTimeSlots([...timeSlots, slotString]);
        setNewSlotDate('');
        setNewSlotTime('');
        setError(null);
    };

    const removeTimeSlot = (index) => {
        setTimeSlots(timeSlots.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (timeSlots.length === 0) {
            setError('Please add at least one time slot');
            return;
        }

        if (location === 'Online' && !meetingLink.trim()) {
            setError('Please provide a meeting link');
            return;
        }

        // 👇 THÊM: Validate địa chỉ văn phòng
        if (location === 'Office' && !officeAddress.trim()) {
            setError('Please provide the office address');
            return;
        }

        setSending(true);
        setError(null);

        try {
            // 👇 LOGIC: Xác định location cuối cùng để lưu vào DB
            // Nếu là Office thì lưu địa chỉ cụ thể, nếu không thì giữ nguyên (Online/Phone)
            const finalLocation = location === 'Office' ? officeAddress : location;

            console.log('📤 Sending invitation with data:', {
                applicationId: application.id,
                timeSlots,
                location: finalLocation,
                meetingLink: location === 'Online' ? meetingLink : null,
                notes,
                duration
            });

            const response = await api.post('/interviews/send-invitation', {
                applicationId: application.id,
                timeSlots,
                location: finalLocation, // Sử dụng finalLocation
                meetingLink: location === 'Online' ? meetingLink : null,
                notes,
                duration
            });

            console.log('✅ Response:', response.data);

            setSuccess(true);
            
            // Gửi email
            const scheduleLink = `${window.location.origin}/interview/schedule/${application.id}`;
            
            // 👇 LOGIC: Tạo nội dung chi tiết về địa điểm cho email
            let locationDetails = `- Location: ${finalLocation}`;
            if (location === 'Online') {
                locationDetails += `\n- Meeting Link: ${meetingLink}`;
            }

            await api.post('/employer/send-bulk-email', {
                applicationIds: [application.id],
                subject: `Interview Invitation - ${jobTitle}`,
                // 👇 SỬA LẠI PHẦN NÀY: Dùng thẻ <b> thay vì **
                message: `Dear ${application.candidate_name},

We are impressed with your application and would like to invite you for an interview.

<b>Schedule Your Interview:</b>
Please visit the link below to select a time slot that works for you:
${scheduleLink}

<b>Interview Details:</b>
- Duration: ${duration} minutes
${locationDetails}

${notes ? `\n<b>Notes:</b>\n${notes}` : ''}

Please confirm your preferred time slot within 48 hours.

Best regards,
Hiring Team`
            });

            setTimeout(() => {
                onSent && onSent(response.data);
                onClose();
                setTimeSlots([]);
                setLocation('Online');
                setMeetingLink('');
                setOfficeAddress(''); // Reset address
                setNotes('');
                setDuration(60);
                setSuccess(false);
            }, 2000);

        } catch (err) {
            console.error('❌ Error details:', err);
            console.error('❌ Response data:', err.response?.data);
            
            // Hiển thị lỗi chi tiết hơn
            const errorMessage = err.response?.data?.details 
                || err.response?.data?.error 
                || err.message 
                || 'Failed to send invitation';
            
            setError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen || !application) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                <svg className="h-7 w-7 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedule Interview
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Invite <strong>{application.candidate_name}</strong> for interview
                            </p>
                        </div>
                        <button onClick={onClose} disabled={sending} className="text-gray-500 hover:text-gray-700">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Interview invitation sent! Email sent to candidate.
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Time Slots - Calendar Version */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Available Time Slots <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="date"
                                    value={newSlotDate}
                                    onChange={(e) => setNewSlotDate(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <input
                                    type="time"
                                    value={newSlotTime}
                                    onChange={(e) => setNewSlotTime(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={addTimeSlot}
                                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold"
                                >
                                    Add Slot
                                </button>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600 mb-3">
                                    Click on dates and times in the calendar to select when you're available
                                </p>
                                <InterviewCalendar
                                    selectedSlots={timeSlots}
                                    onSlotsChange={setTimeSlots}
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                disabled={sending}
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                disabled={sending}
                            >
                                <option value="Online">Online (Video Call)</option>
                                <option value="Office">At Office</option>
                                <option value="Phone">Phone Interview</option>
                            </select>
                        </div>

                        {/* Meeting Link */}
                        {location === 'Online' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Meeting Link <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                    disabled={sending}
                                />
                            </div>
                        )}

                        {/* 👇 THÊM: Office Address Input */}
                        {location === 'Office' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Office Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={officeAddress}
                                    onChange={(e) => setOfficeAddress(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g. Floor 12, Bitexco Financial Tower, 2 Hai Trieu, District 1, HCMC"
                                    disabled={sending}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Additional information for candidate..."
                                disabled={sending}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                        disabled={sending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || timeSlots.length === 0 || (location === 'Online' && !meetingLink.trim()) || (location === 'Office' && !officeAddress.trim())}
                        className="px-8 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50 flex items-center shadow-lg"
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Send Invitation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewInvitationModal;