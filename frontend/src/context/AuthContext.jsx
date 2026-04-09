import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL as API_BASE } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authNotice, setAuthNotice] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem('phishguard_token');
        const storedUser = localStorage.getItem('phishguard_user');

        if (!storedToken || !storedUser) {
            setLoading(false);
            return;
        }

        fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            credentials: 'include',
        })
            .then((res) => {
                if (res.ok) {
                    setUser({ ...JSON.parse(storedUser), token: storedToken });
                    return;
                }

                localStorage.removeItem('phishguard_token');
                localStorage.removeItem('phishguard_user');
            })
            .catch(() => {
                setUser({ ...JSON.parse(storedUser), token: storedToken });
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        let res;
        try {
            res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
                credentials: 'include',
            });
        } catch (error) {
            throw new Error(`Cannot reach backend at ${API_BASE}.`);
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status >= 500) {
                throw new Error('Backend error during login. Please try again.');
            }
            throw new Error(err.detail || 'Login failed. Check your credentials.');
        }

        const data = await res.json();
        const userData = { username: data.username, role: data.role };
        localStorage.setItem('phishguard_token', data.access_token);
        localStorage.setItem('phishguard_user', JSON.stringify(userData));
        setAuthNotice('');
        setUser({ ...userData, token: data.access_token });
        return userData;
    };

    const logout = (message = '') => {
        localStorage.removeItem('phishguard_token');
        localStorage.removeItem('phishguard_user');
        setAuthNotice(message);
        setUser(null);
    };

    const authHeaders = () =>
        user ? { Authorization: `Bearer ${user.token}` } : {};

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, authHeaders, authNotice, setAuthNotice }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
