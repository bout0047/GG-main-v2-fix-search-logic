import React, { useState } from 'react';
import logo from '../assets/Logo-Marjane-Group-horizontal-1---400x60pxls.png'; // Adjust the path as necessary

interface LoginProps {
    onLogin: (accessKey: string, secretKey: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error state
        setError(null);

        // Validate input
        if (!accessKey || !secretKey) {
            setError('Please enter both Access Key and Secret Key.');
            return;
        }

        try {
            setIsLoading(true); // Show loading state
            // Call the parent onLogin function
            await onLogin(accessKey, secretKey);
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div className="text-center">
                    <img src={logo} alt="Marjane Group Logo" className="mx-auto h-12 w-auto" />
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Access Key Input */}
                        <div>
                            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
                                Login
                            </label>
                            <input
                                id="accessKey"
                                name="accessKey"
                                type="text"
                                required
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                placeholder="Login"
                            />
                        </div>

                        {/* Secret Key Input */}
                        <div>
                            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="secretKey"
                                name="secretKey"
                                type="password"
                                required
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
