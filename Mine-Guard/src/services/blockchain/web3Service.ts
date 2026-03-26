import { ethers } from 'ethers';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

function resolveRpcUrl(): string {
    const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.hostUri || (Constants as any)?.manifest?.debuggerHost;
    if (hostUri && typeof hostUri === 'string') {
        const host = hostUri.split(':')[0];
        return `http://${host}:8545`;
    }
    const env = process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL;
    if (env && env.length > 0) return env;
    if (Platform.OS === 'android') return 'http://10.0.2.2:8545';
    return 'http://localhost:8545';
}

const ETHEREUM_RPC = resolveRpcUrl();
const CHAIN_ID = Number(process.env.EXPO_PUBLIC_CHAIN_ID) || 1337;
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS || '';
const ADMIN_PRIVATE_KEY = process.env.EXPO_PUBLIC_ADMIN_PRIVATE_KEY || '';

// For web, we need to handle MetaMask injection
declare global {
    interface Window {
        ethereum?: any;
    }
}

class Web3Service {
    private signer: ethers.Signer | null = null;
    private provider: ethers.providers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC);
        // Dev/mobile fallback: use admin private key if provided to create a signer
        if (ADMIN_PRIVATE_KEY && ADMIN_PRIVATE_KEY.length > 0) {
            try {
                const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
                this.signer = wallet.connect(this.provider);
                // Optional: log for dev
                if (__DEV__) {
                    console.log('[web3Service] Using ADMIN_PRIVATE_KEY signer for transactions');
                }
            } catch (e) {
                console.log('[web3Service] Failed to initialize signer from ADMIN_PRIVATE_KEY:', (e as any)?.message);
            }
        }
    }

    getConfig() {
        return {
            rpcUrl: ETHEREUM_RPC,
            chainId: CHAIN_ID,
            contractAddress: CONTRACT_ADDRESS,
        };
    }

    getSigner() {
        return this.signer;
    }

    async connectMetaMask(): Promise<string> {
        try {
            // Check if running on web
            if (typeof window !== 'undefined' && window.ethereum) {
                // Web with MetaMask
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                });

                const provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = provider.getSigner();

                return accounts[0];
            } else {
                // Fallback for mobile/development: use admin private key signer
                if (this.signer) {
                    return await this.signer.getAddress();
                }
                throw new Error(
                    'No signer available. Provide EXPO_PUBLIC_ADMIN_PRIVATE_KEY or use MetaMask on web.'
                );
            }
        } catch (error) {
            console.error('Error connecting MetaMask:', error);
            throw error;
        }
    }

    async getConnectedAddress(): Promise<string | null> {
        try {
            if (this.signer) {
                return await this.signer.getAddress();
            }
            return null;
        } catch (error) {
            console.error('Error getting address:', error);
            return null;
        }
    }

    async getChainId(): Promise<number> {
        try {
            if (typeof window !== 'undefined' && window.ethereum) {
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId',
                });
                return parseInt(chainId, 16);
            }
            return CHAIN_ID;
        } catch (error) {
            console.error('Error getting chain ID:', error);
            return CHAIN_ID;
        }
    }

    async signMessage(message: string): Promise<string> {
        if (!this.signer) {
            throw new Error('Signer not connected');
        }

        try {
            return await this.signer.signMessage(message);
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }

    async disconnect() {
        this.signer = null;
    }
}

export const web3Service = new Web3Service();
