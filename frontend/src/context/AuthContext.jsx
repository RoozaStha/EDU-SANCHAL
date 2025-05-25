import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [dark, setDark] = useState(false);

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

    const modeChange = () => {
        const newMode = !dark;
        localStorage.setItem("mode", newMode);
        setDark(newMode);
    };

    useEffect(() => {
        const mode = localStorage.getItem("mode");
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (mode !== null) {
            setDark(JSON.parse(mode));
        }
        
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
        <AuthContext.Provider value={{ authenticated, user, dark, login, logout, modeChange }}>
            {children}
        </AuthContext.Provider>
    );
};