const hre = require("hardhat");

async function main() {
  console.log("Deploying ProposalVoting contract...");
  
  const ProposalVoting = await hre.ethers.getContractFactory("ProposalVoting");
  const voting = await ProposalVoting.deploy();
  
  await voting.deployed();
  
  console.log("✅ ProposalVoting contract deployed to:", voting.address);
  console.log("\n📝 Add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${voting.address}`);
  
  // Save the contract address and ABI
  const fs = require("fs");
  const contractData = {
    address: voting.address,
    abi: JSON.parse(voting.interface.format('json'))
  };
  
  fs.writeFileSync(
    "./src/config/contract.json",
    JSON.stringify(contractData, null, 2)
  );
  
  console.log("\n✅ Contract data saved to src/config/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
