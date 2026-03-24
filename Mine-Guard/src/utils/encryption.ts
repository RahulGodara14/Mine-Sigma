import CryptoJS from 'crypto-js';

// Simple encryption utilities for privacy
// In production, consider using proper encryption libraries

export const encryptData = (data: string, key: string): string => {
    try {
        return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};

export const decryptData = (encryptedData: string, key: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};

export const hashData = (data: string): string => {
    return CryptoJS.SHA256(data).toString();
};

export const generateRandomKey = (): string => {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

// Generate anonymous identifier from wallet address
export const generateAnonymousId = (walletAddress: string): string => {
    const hash = CryptoJS.SHA256(walletAddress).toString();
    return `ANON-${hash.substring(0, 12).toUpperCase()}`;
};
