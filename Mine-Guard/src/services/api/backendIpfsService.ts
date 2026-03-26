import { authAxios } from './authService';

// Uses backend proxy endpoints for IPFS pinning (requires user JWT already set on authAxios globally if reused)
const BASE = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

class BackendIPFSService {
  async uploadFile(uri: string, fileName: string, mimeType?: string): Promise<string> {
    const form = new FormData();
    form.append('file', {
      uri,
      name: fileName,
      type: mimeType || inferMimeType(fileName) || 'application/octet-stream',
    } as any);

    const resp = await authAxios.post(`/ipfs/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data.ipfs_hash;
  }

  async uploadJSON(payload: any): Promise<string> {
    const resp = await authAxios.post(`/ipfs/upload-json`, payload);
    return resp.data.ipfs_hash;
  }
}

function inferMimeType(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return undefined;
}

export const backendIpfsService = new BackendIPFSService();