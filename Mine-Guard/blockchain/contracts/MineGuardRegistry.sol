// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MineGuardRegistry {
    enum ReportStatus {
        PENDING,
        UNDER_REVIEW,
        APPROVED,
        REJECTED
    }

    enum ReportSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct Report {
        string ipfsHash;
        uint256 timestamp;
        address reporter;
        ReportStatus status;
        ReportSeverity severity;
        uint256 rewardAmount;
        bool rewardClaimed;
    }

    address public admin;
    uint256 public reportCount;
    uint256 public contractBalance;

    mapping(uint256 => Report) public reports;
    mapping(address => uint256[]) public reporterReports;
    mapping(address => uint256) public reporterRewardBalance;

    event ReportSubmitted(
        uint256 indexed reportId,
        address indexed reporter,
        string ipfsHash,
        ReportSeverity severity
    );

    event ReportReviewed(
        uint256 indexed reportId,
        ReportStatus status,
        uint256 rewardAmount
    );

    event RewardClaimed(
        uint256 indexed reportId,
        address indexed reporter,
        uint256 amount
    );

    event ContractFunded(address indexed funder, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier reportExists(uint256 reportId) {
        require(reportId < reportCount, "Report does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
        reportCount = 0;
        contractBalance = 0;
    }

    // Submit a new report
    function submitReport(string memory ipfsHash, uint8 severity)
        external
        returns (uint256)
    {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(severity <= 3, "Invalid severity level");

        uint256 reportId = reportCount;
        
        reports[reportId] = Report({
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            reporter: msg.sender,
            status: ReportStatus.PENDING,
            severity: ReportSeverity(severity),
            rewardAmount: 0,
            rewardClaimed: false
        });

        reporterReports[msg.sender].push(reportId);
        reportCount++;

        emit ReportSubmitted(
            reportId,
            msg.sender,
            ipfsHash,
            ReportSeverity(severity)
        );

        return reportId;
    }

    // Review and approve/reject report
    function reviewReport(uint256 reportId, bool approved)
        external
        onlyAdmin
        reportExists(reportId)
    {
        Report storage report = reports[reportId];
        require(
            report.status == ReportStatus.PENDING,
            "Report already reviewed"
        );

        if (approved) {
            report.status = ReportStatus.APPROVED;
            
            // Calculate reward based on severity
            uint256 reward = calculateReward(report.severity);
            report.rewardAmount = reward;
            reporterRewardBalance[report.reporter] += reward;
            
            emit ReportReviewed(reportId, ReportStatus.APPROVED, reward);
        } else {
            report.status = ReportStatus.REJECTED;
            emit ReportReviewed(reportId, ReportStatus.REJECTED, 0);
        }
    }

    // Claim reward for approved report
    function claimReward(uint256 reportId)
        external
        reportExists(reportId)
    {
        Report storage report = reports[reportId];
        require(
            report.reporter == msg.sender,
            "Only reporter can claim reward"
        );
        require(
            report.status == ReportStatus.APPROVED,
            "Report not approved"
        );
        require(!report.rewardClaimed, "Reward already claimed");
        require(report.rewardAmount > 0, "No reward to claim");
        require(
            contractBalance >= report.rewardAmount,
            "Insufficient contract balance"
        );

        report.rewardClaimed = true;
        contractBalance -= report.rewardAmount;
        reporterRewardBalance[msg.sender] -= report.rewardAmount;

        (bool success, ) = msg.sender.call{value: report.rewardAmount}("");
        require(success, "Reward transfer failed");

        emit RewardClaimed(reportId, msg.sender, report.rewardAmount);
    }

    // Get reporter's reports
    function getReporterReports(address reporter)
        external
        view
        returns (uint256[] memory)
    {
        return reporterReports[reporter];
    }

    // Get report details
    function getReport(uint256 reportId)
        external
        view
        reportExists(reportId)
        returns (Report memory)
    {
        return reports[reportId];
    }

    // Get contract balance
    function getContractBalance() external view returns (uint256) {
        return contractBalance;
    }

    // Fund contract
    function fundContract() external payable {
        require(msg.value > 0, "Fund amount must be greater than 0");
        contractBalance += msg.value;
        emit ContractFunded(msg.sender, msg.value);
    }

    // Calculate reward based on severity
    function calculateReward(ReportSeverity severity)
        internal
        pure
        returns (uint256)
    {
        if (severity == ReportSeverity.CRITICAL) {
            return 10 ether;
        } else if (severity == ReportSeverity.HIGH) {
            return 5 ether;
        } else if (severity == ReportSeverity.MEDIUM) {
            return 2 ether;
        } else {
            return 1 ether;
        }
    }

    // Get reporter's reward balance
    function getReporterBalance(address reporter)
        external
        view
        returns (uint256)
    {
        return reporterRewardBalance[reporter];
    }

    // Withdraw (admin only)
    function withdraw(uint256 amount) external onlyAdmin {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {
        contractBalance += msg.value;
        emit ContractFunded(msg.sender, msg.value);
    }
}
