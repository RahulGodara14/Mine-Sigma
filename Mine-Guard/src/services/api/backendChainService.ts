import { authAxios } from './authService';

interface LocationPayload { latitude: number; longitude: number; address?: string }
interface MediaFilePayload { ipfsHash: string; type: string; fileName: string }

class BackendChainService {
  async submitOnChain(
    ipfsHash: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    category?: string,
    description?: string,
    location?: LocationPayload,
    mediaFiles?: MediaFilePayload[]
  ): Promise<{ tx_hash: string; contract_report_id: number; id: string; status: string }> {
    const resp = await authAxios.post('/reports/submit-onchain', {
      ipfs_hash: ipfsHash,
      severity,
      category,
      description,
      location,
      mediaFiles,
    });
    return resp.data;
  }
}

export const backendChainService = new BackendChainService();
