import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;

    const getStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 1;
        if (/[a-z]/.test(pass)) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(pass)) strength += 1;
        return strength;
    };

    const strength = getStrength(password);

    const getColor = () => {
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getText = () => {
        if (strength <= 2) return 'Weak';
        if (strength <= 3) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Password Strength:</span>
                <span className={`text-xs font-bold ${
                    strength <= 2 ? 'text-red-500' : 
                    strength <= 3 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                    {getText()}
                </span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${getColor()}`} 
                    style={{ width: `${(strength / 5) * 100}%` }}
                ></div>
            </div>
            <ul className="mt-2 space-y-1">
                <li className={`text-xs flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                </li>
                <li className={`text-xs flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/[A-Z]/.test(password) ? '✓' : '○'}</span> Uppercase letter
                </li>
                <li className={`text-xs flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/[0-9]/.test(password) ? '✓' : '○'}</span> Number
                </li>
            </ul>
        </div>
    );
};

export default PasswordStrengthIndicator;