import { authAxios } from './authService';
import type { Report } from '../../types';

type BackendReportItem = {
  id: string;
  ipfsHash?: string;
  category: Report['category'];
  description: string;
  severity: Report['severity'];
  status: Report['status'];
  latitude?: number;
  longitude?: number;
  address?: string;
  rewardAmount?: number;
  adminNotes?: string;
  createdAt?: string;
};

export class BackendReportsService {
  async myReports(skip = 0, limit = 50): Promise<Report[]> {
    const resp = await authAxios.get('/reports/my-reports', { params: { skip, limit } });
    const data = resp.data as { total: number; reports: BackendReportItem[] };

    const reports = Array.isArray(data?.reports) ? data.reports : [];

    return reports.map((r) => {
      const ts = r.createdAt ? Date.parse(r.createdAt) : Date.now();
      return {
        id: String(r.id),
        ipfsHash: String(r.ipfsHash ?? ''),
        location: {
          latitude: Number(r.latitude ?? 0),
          longitude: Number(r.longitude ?? 0),
          address: r.address ?? undefined,
        },
        description: r.description,
        category: r.category,
        severity: r.severity,
        mediaFiles: [],
        timestamp: Number.isFinite(ts) ? ts : Date.now(),
        reporterAddress: '',
        status: r.status,
        rewardAmount: r.rewardAmount,
        adminNotes: r.adminNotes,
      } as Report;
    });
  }
}

export const backendReportsService = new BackendReportsService();
