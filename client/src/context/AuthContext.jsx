import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set axios default header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/auth/profile');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post('/api/auth/login', { email, password });
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return user;
    };

    const register = async (userData) => {
        const response = await axios.post('/api/auth/register', userData);
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isEmployer: user?.role === 'employer',
        isCandidate: user?.role === 'candidate'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};