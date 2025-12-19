import React, { useState } from 'react';
import api from '../services/api';

const CVUpload = () => {
    const [cvFile, setCvFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCvFile(file);
            setError('');
            setMessage('');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setCvFile(e.dataTransfer.files[0]);
            setError('');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!cvFile) {
            setError('Please select a CV file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('cv', cvFile);

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/cv/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage('CV uploaded successfully!');
            setCvFile(null);
        } catch (error) {
            setError('Error uploading CV. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Upload Your CV</h2>
                <p className="text-gray-600 mb-6">Upload your CV to match with available jobs</p>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                
                {message && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                        {message}
                    </div>
                )}

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                        dragActive 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <svg 
                        className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                        stroke="currentColor" 
                        fill="none" 
                        viewBox="0 0 48 48"
                    >
                        <path 
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                    </svg>
                    
                    <div className="mb-4">
                        <label 
                            htmlFor="file-upload" 
                            className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Click to upload
                        </label>
                        <span className="text-gray-600"> or drag and drop</span>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    
                    <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX, or TXT (max. 5MB)
                    </p>
                </div>

                {cvFile && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <svg 
                                    className="h-8 w-8 text-blue-600" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                                <div>
                                    <p className="font-semibold text-gray-800">{cvFile.name}</p>
                                    <p className="text-sm text-gray-600">{formatFileSize(cvFile.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCvFile(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleUpload}
                    disabled={!cvFile || loading}
                    className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Uploading...' : 'Upload CV'}
                </button>
            </div>
        </div>
    );
};

export default CVUpload;