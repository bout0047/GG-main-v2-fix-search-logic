import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    X,
    AlertCircle,
    Tag as TagIcon,
    Search as SearchIcon,
} from 'lucide-react';
import {
    getFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileMetadata,
    previewImage as previewImageApi,
    type FileData,
    type Tag,
} from '../services/api';
import TagSelectionModal from './TagSelectionModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface FileListProps {
    bucketName: string;
    accessKey: string;
    secretKey: string;
    onBack: () => void;
}

const ImagePreview: React.FC<{ src: string; onClose: () => void; accessKey: string; secretKey: string }> = ({ src, onClose, accessKey, secretKey }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await fetch(src, {
                    headers: {
                        'X-Access-Key': accessKey,
                        'X-Secret-Key': secretKey,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch image. Status: ${response.status}`);
                }

                const blob = await response.blob();
                setImageSrc(URL.createObjectURL(blob));
            } catch (err: any) {
                console.error('Error fetching image:', err);
                setError('Failed to load image.');
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [src, accessKey, secretKey]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            {loading ? (
                <div className="text-white">Loading image...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                imageSrc && (
                    <img src={imageSrc} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-lg" />
                )
            )}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 focus:outline-none"
            >
                Close
            </button>
        </div>
    );
};

const FileList: React.FC<FileListProps> = ({ bucketName, accessKey, secretKey, onBack }) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [imageObjectUrls, setImageObjectUrls] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedFileTags, setSelectedFileTags] = useState<Tag[]>([]);
    const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
    const [progress, setProgress] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        loadFiles();
    }, [bucketName]);

    const loadImageWithHeaders = async (fileName: string) => {
        try {
            const response = await fetch(`${API_URL}/files/${bucketName}/${fileName}`, {
                headers: {
                    'X-Access-Key': accessKey,
                    'X-Secret-Key': secretKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            console.error(`Error loading image for ${fileName}:`, err);
            return null;
        }
    };

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);

            const filesData = await getFiles(bucketName, accessKey, secretKey);
            console.log('Files Data:', filesData); // Debugging log

            const filesWithTags = await Promise.all(
                filesData.map(async (file) => {
                    try {
                        const metadata = await getFileMetadata(bucketName, file.name, accessKey, secretKey);
                        console.log(`Metadata for ${file.name}:`, metadata); // Debugging log
                        return { ...file, tags: metadata.tags || [], metadata: metadata };
                    } catch (err) {
                        console.error(`Error fetching metadata for ${file.name}:`, err);
                        return file;
                    }
                })
            );

            console.log('Files with Tags:', filesWithTags); // Debugging log
            setFiles(filesWithTags);

            const newImageObjectUrls: Record<string, string> = {};
            await Promise.all(
                filesWithTags.map(async (file) => {
                    if (isImageFile(file.name)) {
                        const objectUrl = await loadImageWithHeaders(file.name);
                        if (objectUrl) {
                            newImageObjectUrls[file.name] = objectUrl;
                        }
                    }
                })
            );

            setImageObjectUrls(newImageObjectUrls);
        } catch (err: any) {
            console.error('Error loading files:', err);
            setError(err.message || 'Failed to load files.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            Object.values(imageObjectUrls).forEach((url) => URL.revokeObjectURL(url));
        };
    }, [imageObjectUrls]);

    const handlePreviewImage = async (fileName: string) => {
        try {
            const imageUrl = await previewImageApi(bucketName, fileName, accessKey, secretKey);
            setPreviewImage(imageUrl);
        } catch (err: any) {
            console.error('Failed to load image preview:', err);
            setError('Failed to preview image.');
        }
    };

    const handleFileSelect = (fileList: FileList | null) => {
        if (fileList) {
            setSelectedFiles(Array.from(fileList));
            setShowTagModal(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length || uploading) return;

        try {
            setUploading(true);
            setError(null);
            setProgress(0);

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                await uploadFile(bucketName, file, accessKey, secretKey, selectedFileTags);
                setProgress(((i + 1) / selectedFiles.length) * 100);
            }

            await loadFiles();
            setSelectedFiles([]);
            setSelectedFileTags([]);
            setShowTagModal(false);
        } catch (err: any) {
            console.error('Error uploading files:', err);
            setError(err.message || 'Failed to upload files.');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleDelete = async (fileNames: string[]) => {
        if (window.confirm('Are you sure you want to delete the selected file(s)?')) {
            try {
                setError(null);
                for (const fileName of fileNames) {
                    await deleteFile(bucketName, fileName, accessKey, secretKey);
                }
                await loadFiles();
                setSelectedFileNames([]);
            } catch (err: any) {
                console.error('Error deleting files:', err);
                setError(err.message || 'Failed to delete files.');
            }
        }
    };

    const handleDownload = async (fileNames: string[]) => {
        try {
            for (const fileName of fileNames) {
                const blob = await downloadFile(bucketName, fileName, accessKey, secretKey);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (err: any) {
            console.error('Error downloading files:', err);
            setError(err.message || 'Failed to download files.');
        }
    };

    const isImageFile = (filename: string) => {
        const ext = filename.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    };

    const toggleFileSelection = (fileName: string) => {
        setSelectedFileNames((prevSelected) =>
            prevSelected.includes(fileName)
                ? prevSelected.filter((name) => name !== fileName)
                : [...prevSelected, fileName]
        );
    };

    const filteredFiles = files.filter((file) => {
        const query = searchQuery.toLowerCase();
        return (
            file.name.toLowerCase().includes(query) ||
            (file.tags || []).some((tag) =>
                (tag.key?.toLowerCase().includes(query) || tag.value?.toLowerCase().includes(query))
            ) ||
            Object.values(file.metadata || {}).some((value) =>
                value?.toString().toLowerCase().includes(query)
            )
        );
    });

    useEffect(() => {
        console.log('Files:', files);
        console.log('Search Query:', searchQuery);
        console.log(
            'Filtered Files:',
            files.filter((file) =>
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }, [files, searchQuery]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse text-gray-600">Loading files...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center text-red-800">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">{bucketName}</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={() => handleDelete(selectedFileNames)}
                        disabled={selectedFileNames.length === 0}
                        className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium text-white ${selectedFileNames.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                    </button>
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                />
                <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            </div>

            {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {filteredFiles.length === 0 && (
                <div className="text-gray-500 text-sm">No files match your search.</div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedFileNames(filteredFiles.map((file) => file.name));
                                    } else {
                                        setSelectedFileNames([]);
                                    }
                                }}
                                checked={selectedFileNames.length === filteredFiles.length && filteredFiles.length > 0}
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                        <tr key={file.name}>
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selectedFileNames.includes(file.name)}
                                    onChange={() => toggleFileSelection(file.name)}
                                />
                            </td>
                            <td className="px-6 py-4">
                                {isImageFile(file.name) && (
                                    <img
                                        src={imageObjectUrls[file.name] || ''}
                                        alt={file.name}
                                        className="h-10 w-10 rounded-lg object-cover cursor-pointer"
                                        onClick={() => handlePreviewImage(file.name)}
                                    />
                                )}
                                {file.name}
                            </td>
                            <td className="px-6 py-4">{Math.round((file.size || 0) / 1024)} KB</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                    {file.tags && file.tags.length > 0 ? (
                                        file.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                            >
                                                <TagIcon className="h-3 w-3 mr-1" />
                                                {`${(tag.key || tag.Key || 'No Key').toString().toLowerCase()}: ${(tag.value || tag.Value || 'No Value').toString().toLowerCase()}`}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500">No tags</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDownload([file.name])} className="text-gray-400 hover:text-gray-500">
                                    <Download className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleDelete([file.name])} className="text-red-400 hover:text-red-500">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showTagModal && selectedFiles.length > 0 && (
                <TagSelectionModal
                    isOpen={showTagModal}
                    fileName={selectedFiles.map((file) => file.name).join(', ')}
                    selectedTags={selectedFileTags}
                    onTagsChange={setSelectedFileTags}
                    onClose={() => {
                        setShowTagModal(false);
                        setSelectedFiles([]);
                    }}
                    onConfirm={handleUpload}
                />
            )}

            {previewImage && (
                <ImagePreview
                    src={previewImage}
                    onClose={() => setPreviewImage(null)}
                    accessKey={accessKey}
                    secretKey={secretKey}
                />
            )}
        </div>
    );
};

export default FileList;
