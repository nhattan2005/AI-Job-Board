import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const postJob = async (jobData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/jobs`, jobData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getJobs = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/jobs`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const uploadCV = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/cvs`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const tailorCV = async (cvText, jobDescription) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/tailor-cv`, {
            cvText,
            jobDescription,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getMatchingScore = async (cvVector, jobVector) => {
    // This function can be implemented if needed for direct matching score retrieval
    // Currently, matching score is calculated on the server side
};