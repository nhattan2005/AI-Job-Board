import React from 'react';

const AdminLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header với spacing đồng nhất */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg text-slate-600 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;