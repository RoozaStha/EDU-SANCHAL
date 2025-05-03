/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const login = (credentials) => {
        localStorage.setItem('token', 'your-auth-token'); // You should store actual token
        localStorage.setItem('user', JSON.stringify(credentials));
        setAuthenticated(true);
        setUser(credentials);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthenticated(false);
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token) {
            setAuthenticated(true);
        }
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    return (
        <AuthContext.Provider value={{ authenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};