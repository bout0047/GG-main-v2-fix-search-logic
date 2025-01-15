import React, { useState } from 'react';
import { Tag } from '../services/api';

interface TagSelectionModalProps {
    isOpen: boolean;
    fileName: string;
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    onClose: () => void;
    onConfirm: () => void;
}

const TagSelectionModal: React.FC<TagSelectionModalProps> = ({
    isOpen,
    fileName,
    selectedTags,
    onTagsChange,
    onClose,
    onConfirm,
}) => {
    const [newTagKey, setNewTagKey] = useState('');
    const [newTagValue, setNewTagValue] = useState('');

    const handleAddTag = () => {
        if (newTagKey && newTagValue) {
            onTagsChange([...selectedTags, { key: newTagKey, value: newTagValue }]);
            setNewTagKey('');
            setNewTagValue('');
        }
    };

    const formatFileName = (name: string) => {
        const files = name.split(',');
        if (files.length > 5) {
            return `${files.slice(0, 5).join(', ')}...`;
        }
        return name;
    };

    return isOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                <h2 className="text-lg font-medium">Add Tags to {formatFileName(fileName)}</h2>
                <div>
                    <input
                        type="text"
                        placeholder="Tag Key"
                        value={newTagKey}
                        onChange={(e) => setNewTagKey(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-2"
                    />
                    <input
                        type="text"
                        placeholder="Tag Value"
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <button
                        onClick={handleAddTag}
                        disabled={!newTagKey || !newTagValue} // Button is disabled if either field is empty
                        className={`mt-2 w-full p-2 rounded ${newTagKey && newTagValue ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Add Tag
                    </button>
                </div>
                <ul>
                    {selectedTags.map((tag, index) => (
                        <li key={index} className="text-sm text-gray-700">
                            {tag.key}: {tag.value}
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end space-x-4 mt-4">
                    <button onClick={onClose} className="text-gray-500">Cancel</button>
                    <button onClick={onConfirm} className="bg-blue-500 text-white p-2 rounded">Upload</button>
                </div>
            </div>
        </div>
    ) : null;
};

export default TagSelectionModal;
