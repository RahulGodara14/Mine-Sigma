export interface Report {
  id: string;
  ipfsHash: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description: string;
  category: 'illegal_mining' | 'environmental_damage' | 'safety_violation' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mediaFiles: MediaFile[];
  timestamp: number;
  reporterAddress: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  rewardAmount?: number;
  adminNotes?: string;
}

export interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  fileName: string;
  fileSize: number;
  mimeType: string;
  exifData?: ExifData;
}

export interface ExifData {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  camera?: string;
}

export interface User {
  walletAddress: string;
  totalReports: number;
  approvedReports: number;
  totalRewards: number;
  role: 'citizen' | 'admin';
}

export interface RewardToken {
  balance: number;
  pendingRewards: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'reward' | 'transfer';
  amount: number;
  timestamp: number;
  reportId?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  tokenContractAddress: string;
}
