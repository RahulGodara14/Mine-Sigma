import { MediaFile } from '../types';

export const validateMediaFile = (
    file: MediaFile
): { valid: boolean; error?: string } => {
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (file.type === 'image') {
        if (!allowedImageTypes.includes(file.mimeType)) {
            return {
                valid: false,
                error: 'Invalid image format. Allowed: JPEG, PNG, WebP',
            };
        }

        if (file.fileSize > maxImageSize) {
            return {
                valid: false,
                error: 'Image size exceeds 10MB limit',
            };
        }
    }

    if (file.type === 'video') {
        if (!allowedVideoTypes.includes(file.mimeType)) {
            return {
                valid: false,
                error: 'Invalid video format. Allowed: MP4, WebM, MOV',
            };
        }

        if (file.fileSize > maxVideoSize) {
            return {
                valid: false,
                error: 'Video size exceeds 50MB limit',
            };
        }
    }

    return { valid: true };
};

export const validateWalletAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validateReportDescription = (
    description: string
): { valid: boolean; error?: string } => {
    const minLength = 20;
    const maxLength = 1000;

    if (description.trim().length < minLength) {
        return {
            valid: false,
            error: `Description must be at least ${minLength} characters`,
        };
    }

    if (description.length > maxLength) {
        return {
            valid: false,
            error: `Description must not exceed ${maxLength} characters`,
        };
    }

    return { valid: true };
};

export const validateCoordinates = (
    latitude: number,
    longitude: number
): boolean => {
    return (
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
};
