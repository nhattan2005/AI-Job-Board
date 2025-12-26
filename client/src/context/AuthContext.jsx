import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            console.log('👤 Profile fetched:', response.data.user);
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(user);
            
            return user;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            console.log('📤 Sending registration request:', userData);
            
            const response = await api.post('/auth/register', userData);
            
            console.log('✅ Registration response:', response.data);
            
            const { token, user } = response.data;
            
            // Check if user already verified (admin/test account)
            if (user.email_verified && token) {
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(user);
                return { user, skipVerification: true };
            }
            
            return { user, skipVerification: false };
        } catch (error) {
            console.error('❌ Register error:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
    };

    const isAuthenticated = !!user;
    const isEmployer = user?.role === 'employer';
    const isCandidate = user?.role === 'candidate';
    const isAdmin = user?.role === 'admin'; // 👈 THÊM DÒNG NÀY

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
        isEmployer,
        isCandidate,
        isAdmin // 👈 THÊM VÀO VALUE
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};