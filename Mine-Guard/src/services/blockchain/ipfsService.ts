import axios from 'axios';

// IPFS service using Pinata (you'll need to sign up for API keys)
// Alternative: Use Infura IPFS or run your own IPFS node

const PINATA_API_KEY = process.env.EXPO_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.EXPO_PUBLIC_PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.EXPO_PUBLIC_PINATA_JWT || '';

// Pinata supports either API key/secret headers OR JWT Authorization.
// Prefer JWT if present; otherwise fall back to key/secret.
const baseHeaders: Record<string, string> = {};
if (PINATA_JWT) {
    baseHeaders['Authorization'] = `Bearer ${PINATA_JWT}`;
} else {
    if (PINATA_API_KEY) baseHeaders['pinata_api_key'] = PINATA_API_KEY;
    if (PINATA_SECRET_KEY) baseHeaders['pinata_secret_api_key'] = PINATA_SECRET_KEY;
}

const pinataAxios = axios.create({
    baseURL: 'https://api.pinata.cloud',
    headers: baseHeaders,
});

class IPFSService {
    async uploadFile(fileUri: string, fileName: string): Promise<string> {
        try {
            // React Native FormData: pass an object with uri/name/type
            const formData = new FormData();
            const filePart: any = {
              uri: fileUri,
              name: fileName,
              type: 'application/octet-stream',
            };
            formData.append('file', filePart);

            const metadata = JSON.stringify({
                name: fileName,
                keyvalues: {
                    app: 'MineGuard',
                    type: 'media',
                },
            });
            formData.append('pinataMetadata', metadata);

            const pinataResponse = await pinataAxios.post('/pinning/pinFileToIPFS', formData);

            return pinataResponse.data.IpfsHash;
        } catch (error) {
            // Log detailed error for debugging
            if (axios.isAxiosError(error)) {
              console.error('IPFS upload axios error:', error.response?.status, error.response?.data);
            } else {
              console.error('Error uploading to IPFS:', error);
            }
            throw new Error('Failed to upload file to IPFS');
        }
    }

    async uploadJSON(data: any): Promise<string> {
        try {
            const response = await pinataAxios.post('/pinning/pinJSONToIPFS', {
                pinataContent: data,
                pinataMetadata: {
                    name: `report-${Date.now()}.json`,
                    keyvalues: {
                        app: 'MineGuard',
                        type: 'metadata',
                    },
                },
            });

            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading JSON to IPFS:', error);
            throw new Error('Failed to upload metadata to IPFS');
        }
    }

    async getFile(ipfsHash: string): Promise<any> {
        try {
            const response = await axios.get(
                `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching from IPFS:', error);
            throw new Error('Failed to fetch file from IPFS');
        }
    }

    getGatewayUrl(ipfsHash: string): string {
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }

    async unpinFile(ipfsHash: string): Promise<void> {
        try {
            await pinataAxios.delete(`/pinning/unpin/${ipfsHash}`);
        } catch (error) {
            console.error('Error unpinning file:', error);
        }
    }
}

export const ipfsService = new IPFSService();
