import axios, { AxiosError } from 'axios';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create Axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Interfaces
export interface Tag {
    key: string;
    value: string;
}

export interface FileData {
    name: string;
    size?: number;
    contentType?: string;
    tags?: Tag[];
    lastModified?: Date;
}

export interface BucketData {
    name: string;
    created: string;
    access: string;
    size?: string;
    objects?: number;
}

// Unified API Error Handler
const handleApiError = (error: any): never => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('API Error:', {
            status: axiosError.response?.status || 'Network Error',
            data: axiosError.response?.data || 'No Response Data',
            headers: axiosError.response?.headers || 'No Response Headers',
            url: axiosError.config?.url || 'No URL',
        });

        const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            'An unexpected error occurred';

        throw new Error(message);
    }
    throw new Error('Unknown error occurred');
};

// Function to Validate Credentials
const validateCredentials = (accessKey: string, secretKey: string): void => {
    if (!accessKey || !secretKey) {
        throw new Error('Access Key and Secret Key are required for authentication.');
    }
};

// Generate preview URL for an image file
export const generatePreviewUrl = (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): string => {
    if (!bucketName || !fileName || !accessKey || !secretKey) {
        throw new Error('Missing required parameters for generating preview URL.');
    }
    return `${API_URL}/files/${bucketName}/${fileName}`;
};

// API Functions
export const getBuckets = async (accessKey: string, secretKey: string): Promise<BucketData[]> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get('/buckets', {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createBucket = async (name: string, accessKey: string, secretKey: string): Promise<BucketData> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.post(
            '/buckets/create',
            { bucketName: name },
            {
                headers: {
                    'X-Access-Key': accessKey,
                    'X-Secret-Key': secretKey,
                },
            }
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getFiles = async (
    bucketName: string,
    accessKey: string,
    secretKey: string
): Promise<FileData[]> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get(`/buckets/${bucketName}/files`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
        });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        handleApiError(error);
    }
};

export const uploadFile = async (
    bucketName: string,
    file: File,
    accessKey: string,
    secretKey: string,
    tags?: Tag[]
): Promise<void> => {
    validateCredentials(accessKey, secretKey);
    const formData = new FormData();
    formData.append('file', file);

    if (tags && tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
    }

    try {
        await api.post(`/files/${bucketName}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
        });
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteFile = async (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): Promise<void> => {
    validateCredentials(accessKey, secretKey);
    try {
        await api.delete(`/files/${bucketName}/${fileName}`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
        });
    } catch (error) {
        handleApiError(error);
    }
};

export const previewImage = async (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): Promise<string> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get(`/files/${bucketName}/${fileName}`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
            responseType: 'blob',
        });
        return URL.createObjectURL(response.data);
    } catch (error) {
        handleApiError(error);
    }
};

export const downloadFile = async (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): Promise<Blob> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get(`/files/${bucketName}/${fileName}`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getFileMetadata = async (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): Promise<{ tags: Tag[] }> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get(`/files/${bucketName}/${fileName}/metadata`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const previewFile = async (
    bucketName: string,
    fileName: string,
    accessKey: string,
    secretKey: string
): Promise<string> => {
    validateCredentials(accessKey, secretKey);
    try {
        const response = await api.get(`/files/${bucketName}/${fileName}`, {
            headers: {
                'X-Access-Key': accessKey,
                'X-Secret-Key': secretKey,
            },
            responseType: 'arraybuffer',
        });

        // Convert the ArrayBuffer response to a Blob URL for preview
        const blob = new Blob([response.data]);
        return URL.createObjectURL(blob);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};
