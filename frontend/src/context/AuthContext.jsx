import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthenticated(true);
        setUser(userData);
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
        if (token && userStr) {
            try {
                setAuthenticated(true);
                setUser(JSON.parse(userStr));
            } catch (error) {
                console.error("Error parsing user data:", error);
                logout();
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ authenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};