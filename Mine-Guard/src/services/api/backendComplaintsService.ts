import { authAxios } from './authService';

export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

export interface ComplaintItem {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  status: ComplaintStatus | string;
  assigned_officer_id?: string | null;
  created_at: string;
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category?: string;
  location?: any;
  contact_info?: any;
  transaction_hash?: string;
  block_number?: number;
}

class BackendComplaintsService {
  async create(payload: CreateComplaintPayload): Promise<ComplaintItem> {
    const resp = await authAxios.post('/complaints', payload);
    return resp.data;
  }

  async myComplaints(): Promise<ComplaintItem[]> {
    const resp = await authAxios.get('/complaints/my');
    return resp.data;
  }
}

export const backendComplaintsService = new BackendComplaintsService();
