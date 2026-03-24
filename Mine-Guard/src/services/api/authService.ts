import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Base URL resolution order:
// 1) EXPO_PUBLIC_BACKEND_API_URL (best for all platforms)
// 2) Mobile default: use LAN IP if provided via EXPO_PUBLIC_LAN_IP
// 3) Web/desktop: fallback to localhost
const resolveBaseUrl = (): string => {
    // Prefer deriving host from Expo dev server (works on USB/LAN)
    const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.hostUri || (Constants as any)?.manifest?.debuggerHost;
    if (hostUri && typeof hostUri === 'string') {
        const host = hostUri.split(':')[0];
        // Prefer explicit port 3001 for backend
        return `http://${host}:3001`;
    }

    // Explicit env override if no host info was found
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL;
    if (envUrl && envUrl.length > 0) return envUrl;

    // Mobile: Expo Go runs on device; localhost points to the phone.
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const lanIp = process.env.EXPO_PUBLIC_LAN_IP; // e.g., 192.168.1.23
        if (lanIp && lanIp.length > 0) {
            return `http://${lanIp}:3001`;
        }

        // Android emulator special alias to host localhost
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:3001';
        }

        // Encourage explicit config on mobile to avoid silent failures
        console.warn('[authService] No EXPO_PUBLIC_BACKEND_API_URL or EXPO_PUBLIC_LAN_IP set. Defaulting to localhost:3001 which will NOT work on mobile.');
    }

    // Web/desktop fallback
    return 'http://localhost:3001';
};

const API_BASE_URL = resolveBaseUrl();

export const authAxios = axios.create({
    baseURL: API_BASE_URL,
});

// Development debug interceptors (only in dev)
if (__DEV__) {
    console.log('[authService] Base URL resolved =>', API_BASE_URL);
    authAxios.interceptors.request.use((config) => {
        console.log('[authService][request]', config.method?.toUpperCase(), config.baseURL + (config.url || ''), 'data:', config.data);
        return config;
    });
    authAxios.interceptors.response.use(
        (response) => {
            console.log('[authService][response]', response.status, response.config.url, 'data:', response.data);
            return response;
        },
        (error) => {
            if (error.response) {
                console.log('[authService][error]', error.response.status, error.response.config.url, 'data:', error.response.data);
            } else {
                console.log('[authService][error]', 'No response', error.message);
            }
            return Promise.reject(error);
        }
    );
}

export interface SignupPayload {
    email: string;
    password: string;
    walletAddress: string;
    shareProfile: boolean;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        walletAddress: string;
        role: 'citizen' | 'admin';
        shareProfile: boolean;
    };
}

class AuthService {
    async signup(payload: SignupPayload): Promise<AuthResponse> {
        try {
            const response = await authAxios.post('/auth/signup', payload);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.response?.data?.message;
            throw new Error(detail || 'Signup failed');
        }
    }

    async login(payload: LoginPayload): Promise<AuthResponse> {
        try {
            const response = await authAxios.post('/auth/login', payload);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.response?.data?.message;
            throw new Error(detail || 'Login failed');
        }
    }

    async verifyWallet(
        walletAddress: string,
        signature: string,
        nonce: string
    ): Promise<{ token: string }> {
        try {
            const response = await authAxios.post('/auth/verify-wallet', {
                walletAddress,
                signature,
                nonce,
            });
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.response?.data?.message;
            throw new Error(detail || 'Wallet verification failed');
        }
    }

    async getNonce(walletAddress: string): Promise<{ nonce: string }> {
        try {
            const response = await authAxios.get(`/auth/nonce/${walletAddress}`);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.response?.data?.message;
            throw new Error(detail || 'Failed to get nonce');
        }
    }

    setAuthHeader(token: string) {
        authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    clearAuthHeader() {
        delete authAxios.defaults.headers.common['Authorization'];
    }
}

export const authService = new AuthService();