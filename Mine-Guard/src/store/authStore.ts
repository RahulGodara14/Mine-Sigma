import { create } from 'zustand';
import { authService } from '../services/api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    walletAddress: string | null;
    isConnected: boolean;
    role: 'citizen' | 'admin' | null;
    balance: number;
    chainId: number | null;
    jwtToken: string | null;
    userId: string | null;
    shareProfile: boolean;
    email: string | null;

    setWalletAddress: (address: string) => void;
    setConnected: (connected: boolean) => void;
    setRole: (role: 'citizen' | 'admin') => void;
    setBalance: (balance: number) => void;
    setChainId: (chainId: number) => void;
    setJwtToken: (token: string) => void;
    setUserId: (userId: string) => void;
    setShareProfile: (share: boolean) => void;
    setEmail: (email: string) => void;
    disconnect: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    walletAddress: null,
    isConnected: false,
    role: null,
    balance: 0,
    chainId: null,
    jwtToken: null,
    userId: null,
    shareProfile: false,
    email: null,

    setWalletAddress: (address) => {
        // Wallet connection is NOT the same as an authenticated session.
        // We only consider the user connected when a valid JWT exists.
        set({ walletAddress: address });
        AsyncStorage.setItem('walletAddress', address);
    },

    setConnected: (connected) => set({ isConnected: connected }),

    setRole: (role) => {
        set({ role });
        AsyncStorage.setItem('userRole', role);
    },

    setBalance: (balance) => set({ balance }),

    setChainId: (chainId) => set({ chainId }),

    setJwtToken: (token) => {
        set({ jwtToken: token, isConnected: true });
        AsyncStorage.setItem('jwtToken', token);
        // Ensure axios uses the JWT for subsequent requests
        try { authService.setAuthHeader(token); } catch {}
    },

    setUserId: (userId) => {
        set({ userId });
        AsyncStorage.setItem('userId', userId);
    },

    setShareProfile: (share) => {
        set({ shareProfile: share });
        AsyncStorage.setItem('shareProfile', share.toString());
    },

    setEmail: (email) => {
        set({ email });
        if (email) AsyncStorage.setItem('email', email);
    },

    disconnect: () => {
        set({
            walletAddress: null,
            isConnected: false,
            role: null,
            balance: 0,
            chainId: null,
            jwtToken: null,
            userId: null,
            shareProfile: false,
            email: null,
        });
        try { authService.clearAuthHeader(); } catch {}
        AsyncStorage.multiRemove([
            'walletAddress',
            'userRole',
            'jwtToken',
            'userId',
            'shareProfile',
            'email',
        ]);
    },
}));
