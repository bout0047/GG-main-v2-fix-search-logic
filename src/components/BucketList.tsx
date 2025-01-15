import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { getBuckets, createBucket } from '../services/api';

interface BucketListProps {
    onSelectBucket: (bucketName: string) => void;
    accessKey: string;
    secretKey: string;
}

const BucketList: React.FC<BucketListProps> = ({ onSelectBucket, accessKey, secretKey }) => {
    const [buckets, setBuckets] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (accessKey && secretKey) {
            loadBuckets();
        } else {
            setError('Missing access credentials. Please log in again.');
        }
    }, [accessKey, secretKey]);

    const loadBuckets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getBuckets(accessKey, secretKey);
            setBuckets(data);
        } catch (err) {
            setError('Failed to load buckets. Please check your access credentials.');
            console.error('Error loading buckets:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateBucketName = (name: string): string | null => {
        const ipAddressPattern = /^\d{1,3}(\.\d{1,3}){3}$/;
        const invalidCharactersPattern = /[^a-z0-9.-]/;

        if (name.length < 3 || name.length > 63) {
            return 'Bucket name must be between 3 and 63 characters long.';
        }
        if (invalidCharactersPattern.test(name)) {
            return 'Bucket name can only contain lowercase letters, numbers, dots, and hyphens.';
        }
        if (name.includes('..') || name.includes('-.') || name.includes('.-')) {
            return 'Bucket name must not contain two adjacent periods or a period adjacent to a hyphen.';
        }
        if (ipAddressPattern.test(name)) {
            return 'Bucket name must not resemble an IP address.';
        }
        if (name.startsWith('xn--')) {
            return 'Bucket name must not start with the prefix "xn--".';
        }
        if (name.endsWith('-s3alias')) {
            return 'Bucket name must not end with the suffix "-s3alias".';
        }
        return null;
    };

    const suggestAlternativeName = (name: string): string => {
        let suggestedName = name.toLowerCase().replace(/[^a-z0-9.-]/g, '');
        suggestedName = suggestedName.replace(/\.\.|-\.|\.\-/g, '-');
        if (suggestedName.length < 3) {
            suggestedName = `bucket-${suggestedName}`;
        } else if (suggestedName.length > 63) {
            suggestedName = suggestedName.substring(0, 63);
        }
        if (suggestedName.match(/^\d{1,3}(\.\d{1,3}){3}$/)) {
            suggestedName = `bucket-${suggestedName}`;
        }
        if (suggestedName.startsWith('xn--')) {
            suggestedName = `bucket-${suggestedName}`;
        }
        if (suggestedName.endsWith('-s3alias')) {
            suggestedName = suggestedName.replace(/-s3alias$/, '-bucket');
        }
        return suggestedName;
    };

    const handleCreateBucket = async () => {
        const name = prompt('Enter bucket name:');
        if (name) {
            const validationError = validateBucketName(name);
            let bucketNameToCreate = name;
            if (validationError) {
                bucketNameToCreate = suggestAlternativeName(name);
                alert(`${validationError} Automatically creating bucket with suggested name: ${bucketNameToCreate}`);
            }
            try {
                await createBucket(bucketNameToCreate, accessKey, secretKey);
                loadBuckets(); // Reload buckets after creation
            } catch (err) {
                setError('Failed to create bucket. Please try again.');
                console.error('Error creating bucket:', err);
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-red-800">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Folder List</h2>
                <button
                    onClick={handleCreateBucket}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Folder
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Folder Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {buckets.map((bucket) => (
                            <tr key={bucket.name} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FolderOpen className="h-5 w-5 text-indigo-600 mr-2" />
                                        <span className="text-sm font-medium text-gray-900">{bucket.name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {bucket.created ? new Date(bucket.created).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onSelectBucket(bucket.name)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        View Files
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BucketList;
