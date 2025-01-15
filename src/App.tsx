import React, { useState, useEffect } from 'react';
import Login from "./components/Login"; // Adjust the import path as needed
import Dashboard from './components/Dashboard'; // Adjust the import path as needed

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [secretKey, setSecretKey] = useState<string | null>(null);

    // Persist authentication across refreshes using session storage
    useEffect(() => {
        const storedAccessKey = sessionStorage.getItem('accessKey');
        const storedSecretKey = sessionStorage.getItem('secretKey');

        if (storedAccessKey && storedSecretKey) {
            setAccessKey(storedAccessKey);
            setSecretKey(storedSecretKey);
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (accessKey: string, secretKey: string) => {
        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessKey, secretKey }),
            });

            if (!response.ok) {
                const errorMessage = (await response.json()).message || 'Invalid credentials';
                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (result.success) {
                sessionStorage.setItem('accessKey', accessKey);
                sessionStorage.setItem('secretKey', secretKey);
                setAccessKey(accessKey);
                setSecretKey(secretKey);
                setIsAuthenticated(true);
            }
        } catch (error: any) {
            console.error('Login Error:', error.message);
            alert(error.message);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('accessKey');
        sessionStorage.removeItem('secretKey');
        setIsAuthenticated(false);
        setAccessKey(null);
        setSecretKey(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {!isAuthenticated ? (
                <Login onLogin={handleLogin} />
            ) : (
                <Dashboard
                    onLogout={handleLogout}
                    accessKey={accessKey!}
                    secretKey={secretKey!}
                />
            )}
        </div>
    );
}

export default App;
