const hre = require("hardhat");

async function main() {
  console.log("Deploying MineGuardRegistry contract...");

  // Get the contract factory
  const MineGuardRegistry = await hre.ethers.getContractFactory("MineGuardRegistry");

  // Deploy the contract
  const contract = await MineGuardRegistry.deploy();

  // Wait for deployment
  await contract.deploymentTransaction().wait(1);

  const contractAddress = await contract.getAddress();

  console.log("\n✅ MineGuardRegistry deployed successfully!");
  console.log(`📝 Contract Address: ${contractAddress}`);
  console.log(`🔗 Network: ${hre.network.name}`);

  // Save contract address to file
  const fs = require("fs");
  const path = require("path");

  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
  };

  const outputPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n📄 Deployment info saved to: ${outputPath}`);
  console.log("\n🚀 Update your .env file with:");
  console.log(`EXPO_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });