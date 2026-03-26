import { ethers } from 'ethers';
import Constants from 'expo-constants';
import { web3Service } from './web3Service';
import { Report } from '../../types';

// ABI for the MineGuardRegistry contract
const REGISTRY_ABI = [
    'function submitReport(string memory ipfsHash, uint8 severity) external returns (uint256)',
    'function reviewReport(uint256 reportId, bool approved) external',
    'function claimReward(uint256 reportId) external',
    'function getReporterReports(address reporter) external view returns (uint256[])',
    'function getReport(uint256 reportId) external view returns (tuple(string ipfsHash, uint256 timestamp, address reporter, uint8 status, uint8 severity, uint256 rewardAmount, bool rewardClaimed))',
    'function fundContract() external payable',
    'function getContractBalance() external view returns (uint256)',
    'event ReportSubmitted(uint256 indexed reportId, address indexed reporter, string ipfsHash, uint8 severity)',
    'event ReportReviewed(uint256 indexed reportId, uint8 status, uint256 rewardAmount)',
    'event RewardClaimed(uint256 indexed reportId, address indexed reporter, uint256 amount)',
];

class ContractService {
    private getContract() {
        const config = web3Service.getConfig();
        let signer = web3Service.getSigner();

        // Fallback: initialize signer from EXPO_PUBLIC_ADMIN_PRIVATE_KEY if missing
        if (!signer) {
            // Try env first, then Expo extra
            let adminKey = process.env.EXPO_PUBLIC_ADMIN_PRIVATE_KEY as string | undefined;
            if (!adminKey || adminKey.length === 0) {
                const extra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra;
                adminKey = extra?.EXPO_PUBLIC_ADMIN_PRIVATE_KEY;
            }
            if (adminKey && adminKey.length > 0) {
                const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
                try {
                    const wallet = new ethers.Wallet(adminKey).connect(provider);
                    signer = wallet;
                    if (__DEV__) {
                        console.log('[contractService] Using ADMIN_PRIVATE_KEY fallback signer');
                    }
                } catch (e) {
                    console.log('[contractService] Failed to create fallback signer:', (e as any)?.message);
                }
            }
        }

        if (!signer) {
            throw new Error('No signer available to send transactions');
        }

        return new ethers.Contract(
            config.contractAddress,
            REGISTRY_ABI,
            signer
        );
    }

    async submitReport(
        ipfsHash: string,
        severity: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<{ reportId: number; transactionHash: string }> {
        try {
            const contract = this.getContract();

            const severityMap = {
                low: 0,
                medium: 1,
                high: 2,
                critical: 3,
            };

            const tx = await contract.submitReport(
                ipfsHash,
                severityMap[severity]
            );

            const receipt = await tx.wait();

            // Extract reportId from event
            const event = receipt.events?.find(
                (e: any) => e.event === 'ReportSubmitted'
            );
            const reportId = event?.args?.reportId.toNumber();

            return {
                reportId,
                transactionHash: receipt.transactionHash,
            };
        } catch (error) {
            console.error('Error submitting report:', error);
            throw new Error('Failed to submit report to blockchain');
        }
    }

    async reviewReport(
        reportId: number,
        approved: boolean
    ): Promise<string> {
        try {
            const contract = this.getContract();
            const tx = await contract.reviewReport(reportId, approved);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (error) {
            console.error('Error reviewing report:', error);
            throw new Error('Failed to review report');
        }
    }

    async claimReward(reportId: number): Promise<string> {
        try {
            const contract = this.getContract();
            const tx = await contract.claimReward(reportId);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (error) {
            console.error('Error claiming reward:', error);
            throw new Error('Failed to claim reward');
        }
    }

    async getMyReports(address: string): Promise<number[]> {
        try {
            const contract = this.getContract();
            const reportIds = await contract.getReporterReports(address);

            return reportIds.map((id: ethers.BigNumber) => id.toNumber());
        } catch (error) {
            console.error('Error fetching reports:', error);
            return [];
        }
    }

    async getReport(reportId: number): Promise<any> {
        try {
            const contract = this.getContract();
            const report = await contract.getReport(reportId);

            const statusMap = ['pending', 'under_review', 'approved', 'rejected'];
            const severityMap = ['low', 'medium', 'high', 'critical'];

            return {
                ipfsHash: report.ipfsHash,
                timestamp: report.timestamp.toNumber(),
                reporterAddress: report.reporter,
                status: statusMap[report.status],
                severity: severityMap[report.severity],
                rewardAmount: ethers.utils.formatEther(report.rewardAmount),
                rewardClaimed: report.rewardClaimed,
            };
        } catch (error) {
            console.error('Error fetching report:', error);
            throw new Error('Failed to fetch report');
        }
    }

    async getContractBalance(): Promise<string> {
        try {
            const contract = this.getContract();
            const balance = await contract.getContractBalance();

            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error fetching contract balance:', error);
            return '0';
        }
    }

    async fundContract(amount: string): Promise<string> {
        try {
            const contract = this.getContract();
            const tx = await contract.fundContract({
                value: ethers.utils.parseEther(amount),
            });
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (error) {
            console.error('Error funding contract:', error);
            throw new Error('Failed to fund contract');
        }
    }
}

export const contractService = new ContractService();
