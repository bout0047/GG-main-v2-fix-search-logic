import React from 'react';

interface ImagePreviewProps {
    src: string; // The URL of the image to preview
    onClose: () => void; // Function to close the preview
    accessKey: string; // Access key for authentication
    secretKey: string; // Secret key for authentication
}


const ImagePreview: React.FC<ImagePreviewProps> = ({ src, onClose, accessKey, secretKey }) => {
    const [imageSrc, setImageSrc] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const handleFetchImage = async () => {
        try {
            const response = await fetch(src, {
                headers: {
                    'X-Access-Key': accessKey,
                    'X-Secret-Key': secretKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch the image. Status: ${response.status}`);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setImageSrc(imageUrl);
        } catch (err) {
            console.error('Error fetching the image:', err);
            setError('Failed to load the image.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        handleFetchImage();

        // Clean up the object URL when the component is unmounted
        return () => {
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [src, accessKey, secretKey]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            {loading ? (
                <div className="text-white">Loading image...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                imageSrc && (
                    <img
                        src={imageSrc}
                        alt="Preview"
                        className="max-w-full max-h-full rounded-lg shadow-lg"
                    />
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

export default ImagePreview;
