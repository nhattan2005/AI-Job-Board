import React, { useState } from 'react';

const InterviewCalendar = ({ selectedSlots, onSlotsChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    const isSlotSelected = (day, time) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time}:00`;
        return selectedSlots.some(slot => slot.startsWith(dateStr));
    };

    const toggleSlot = (day, time) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time}:00`;
        
        if (isSlotSelected(day, time)) {
            onSlotsChange(selectedSlots.filter(slot => !slot.startsWith(dateStr)));
        } else {
            onSlotsChange([...selectedSlots, dateStr]);
        }
    };

    const isPastDate = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(year, month, day);
        return checkDate < today;
    };

    return (
        <div className="border border-gray-300 rounded-lg p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-lg font-bold text-gray-800">
                    {monthNames[month]} {year}
                </h3>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const past = isPastDate(day);
                    const hasSlots = timeSlots.some(time => isSlotSelected(day, time));

                    return (
                        <div
                            key={day}
                            className={`border rounded-lg p-1 ${
                                past ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-purple-500'
                            } ${hasSlots ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                        >
                            <div className="text-sm font-semibold text-gray-800 mb-1">{day}</div>
                            
                            {!past && (
                                <div className="space-y-1">
                                    {timeSlots.slice(0, 3).map(time => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => toggleSlot(day, time)}
                                            className={`w-full text-xs py-1 rounded ${
                                                isSlotSelected(day, time)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Slots Summary */}
            {selectedSlots.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-800 mb-2">
                        Selected Time Slots ({selectedSlots.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedSlots.map((slot, index) => {
                            const date = new Date(slot);
                            return (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded-full"
                                >
                                    {date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                    })}{' '}
                                    {date.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => onSlotsChange(selectedSlots.filter((_, i) => i !== index))}
                                        className="ml-2 hover:text-purple-200"
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewCalendar;