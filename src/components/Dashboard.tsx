import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import BucketList from './BucketList';
import FileList from './FileList';
import logo from '../assets/Logo-Marjane-Group-horizontal-1---400x60pxls.png'; // Corrected path

interface DashboardProps {
    onLogout: () => void;
    accessKey: string;
    secretKey: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, accessKey, secretKey }) => {
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20"> {/* Adjusted height of the navbar */}
                        <div className="flex items-center flex-grow-0"> {/* Changed flex-grow to 0 to ensure it stays to the far left */}
                            <img
                                src={logo}
                                alt="Marjane Logo"
                                className="h-12 w-auto object-contain mr-4" // Reduced height for smaller logo and added margin-right to provide space
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors duration-200"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!selectedBucket ? (
                    <BucketList
                        onSelectBucket={setSelectedBucket}
                        accessKey={accessKey}
                        secretKey={secretKey}
                    />
                ) : (
                    <FileList
                        bucketName={selectedBucket}
                        onBack={() => setSelectedBucket(null)}
                        accessKey={accessKey}
                        secretKey={secretKey}
                    />
                )}
            </main>
        </div>
    );
};

export default Dashboard;
