from web3 import Web3
from config import settings
import json
from typing import Dict, Tuple

# Simple contract ABI (subset for essential functions)
CONTRACT_ABI = json.loads('''[
    {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"},
                   {"internalType": "uint8", "name": "severity", "type": "uint8"}],
        "name": "submitReport",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"},
                   {"internalType": "bool", "name": "approved", "type": "bool"}],
        "name": "reviewReport",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
        "name": "claimReward",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "reporter", "type": "address"}],
        "name": "getReporterReports",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "type": "function",
        "stateMutability": "view"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
        "name": "getReport",
        "outputs": [{"components": [
            {"internalType": "string", "name": "ipfsHash", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "reporter", "type": "address"},
            {"internalType": "uint8", "name": "status", "type": "uint8"},
            {"internalType": "uint8", "name": "severity", "type": "uint8"},
            {"internalType": "uint256", "name": "rewardAmount", "type": "uint256"},
            {"internalType": "bool", "name": "rewardClaimed", "type": "bool"}
        ], "internalType": "struct MineGuardRegistry.Report", "name": "", "type": "tuple"}],
        "type": "function",
        "stateMutability": "view"
    },
    {
        "inputs": [],
        "name": "getContractBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "type": "function",
        "stateMutability": "view"
    }
]''')


class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.ethereum_rpc_url))
        # Ensure checksum address for contract
        address = Web3.to_checksum_address(settings.contract_address) if settings.contract_address else None
        self.contract = self.w3.eth.contract(
            address=address,
            abi=CONTRACT_ABI
        )
        self.admin_account = self.w3.eth.account.from_key(
            settings.admin_private_key
        )
    
    def is_connected(self) -> bool:
        """Check blockchain connection"""
        return self.w3.is_connected()
    
    def get_nonce(self) -> int:
        """Get current nonce for transaction"""
        return self.w3.eth.get_transaction_count(self.admin_account.address)
    
    def submit_report(
        self, ipfs_hash: str, severity: int, reporter_address: str
    ) -> Tuple[str, int]:
        """Submit report to blockchain"""
        try:
            # Build transaction
            tx = self.contract.functions.submitReport(
                ipfs_hash,
                severity
            ).build_transaction({
                'from': self.admin_account.address,
                'nonce': self.get_nonce(),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            
            # Extract report ID from event logs (ReportSubmitted)
            report_id = 0
            try:
                if receipt.logs and len(receipt.logs) > 0 and len(receipt.logs[0].topics) > 1:
                    topic = receipt.logs[0].topics[1]
                    # topic is HexBytes; convert to int
                    report_id = int(topic.hex(), 16)
            except Exception as _:
                report_id = 0
            
            return tx_hash.hex(), report_id
        except Exception as e:
            print(f"Error submitting report to blockchain: {e}")
            raise
    
    def review_report(self, report_id: int, approved: bool) -> str:
        """Review and approve/reject report"""
        try:
            tx = self.contract.functions.reviewReport(
                report_id,
                approved
            ).build_transaction({
                'from': self.admin_account.address,
                'nonce': self.get_nonce(),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            
            return tx_hash.hex()
        except Exception as e:
            print(f"Error reviewing report: {e}")
            raise
    
    def get_report(self, report_id: int) -> Dict:
        """Fetch report from blockchain"""
        try:
            report = self.contract.functions.getReport(report_id).call()
            
            status_map = {0: "pending", 1: "under_review", 2: "approved", 3: "rejected"}
            severity_map = {0: "low", 1: "medium", 2: "high", 3: "critical"}
            
            return {
                "ipfsHash": report[0],
                "timestamp": report[1],
                "reporter": report[2],
                "status": status_map[report[3]],
                "severity": severity_map[report[4]],
                "rewardAmount": self.w3.from_wei(report[5], 'ether'),
                "rewardClaimed": report[6],
            }
        except Exception as e:
            print(f"Error fetching report: {e}")
            return None
    
    def get_contract_balance(self) -> float:
        """Get contract ETH balance"""
        try:
            balance = self.contract.functions.getContractBalance().call()
            return self.w3.from_wei(balance, 'ether')
        except Exception as e:
            print(f"Error getting contract balance: {e}")
            return 0


blockchain_service = BlockchainService()