import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Smart contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  "function createProposal(string memory _title, uint256 _duration) public returns (uint256)",
  "function vote(uint256 _proposalId) public",
  "function closeProposal(uint256 _proposalId) public",
  "function getProposal(uint256 _proposalId) public view returns (uint256 id, string memory title, address creator, uint256 voteCount, uint256 endsAt, bool active)",
  "function hasUserVoted(uint256 _proposalId, address _voter) public view returns (bool)",
  "function proposalCount() public view returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, string title, address creator, uint256 endsAt)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 timestamp)"
];

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract | null = null;

  constructor() {
    // Connect to local Hardhat network
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545"
    );
    
    // Use Hardhat's first default account private key
    this.wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY!,
      this.provider
    );
    
    console.log('🔗 Blockchain wallet address:', this.wallet.address);
  }

  // Initialize contract after deployment
  initContract(contractAddress: string) {
    this.contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      this.wallet
    );
    console.log('✅ Contract initialized at:', contractAddress);
  }

  // Check if contract is initialized
  private ensureContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized. Deploy contract first or set CONTRACT_ADDRESS in .env');
    }
  }

  // Create a new proposal on blockchain
  async createProposal(title: string, durationInDays: number): Promise<{ proposalId: number; txHash: string }> {
    this.ensureContract();
    
    try {
      const durationInSeconds = durationInDays * 24 * 60 * 60;
      
      console.log(`📝 Creating proposal "${title}" on blockchain...`);
      const tx = await this.contract!.createProposal(title, durationInSeconds);
      
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      
      // Get proposal ID from the event
      const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
      const proposalId = event?.args?.proposalId?.toNumber() || 0;
      
      console.log(`✅ Proposal created! Blockchain ID: ${proposalId}, TX: ${tx.hash}`);
      
      return {
        proposalId,
        txHash: tx.hash
      };
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      throw new Error(`Failed to create proposal on blockchain: ${error.message}`);
    }
  }

  // Cast a vote on blockchain
  async castVote(proposalId: number): Promise<string> {
    this.ensureContract();
    
    try {
      console.log(`🗳️  Casting vote for proposal ${proposalId}...`);
      const tx = await this.contract!.vote(proposalId);
      
      console.log('⏳ Waiting for transaction confirmation...');
      await tx.wait();
      
      console.log(`✅ Vote recorded! TX: ${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      
      // Handle specific errors
      if (error.message.includes('Already voted')) {
        throw new Error('You have already voted on this proposal');
      }
      if (error.message.includes('Proposal not active')) {
        throw new Error('This proposal is no longer active');
      }
      if (error.message.includes('Proposal has ended')) {
        throw new Error('This proposal has ended');
      }
      
      throw new Error(`Failed to cast vote: ${error.message}`);
    }
  }

  // Get proposal details from blockchain
  async getProposal(proposalId: number) {
    this.ensureContract();
    
    try {
      const proposal = await this.contract!.getProposal(proposalId);
      
      return {
        id: proposal.id.toNumber(),
        title: proposal.title,
        creator: proposal.creator,
        voteCount: proposal.voteCount.toNumber(),
        endsAt: new Date(proposal.endsAt.toNumber() * 1000),
        active: proposal.active
      };
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      throw new Error(`Failed to get proposal: ${error.message}`);
    }
  }

  // Check if user already voted
  async hasUserVoted(proposalId: number, voterAddress: string): Promise<boolean> {
    this.ensureContract();
    
    try {
      return await this.contract!.hasUserVoted(proposalId, voterAddress);
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      return false;
    }
  }

  // Get total proposal count
  async getProposalCount(): Promise<number> {
    this.ensureContract();
    
    try {
      const count = await this.contract!.proposalCount();
      return count.toNumber();
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      return 0;
    }
  }

  // Close a proposal
  async closeProposal(proposalId: number): Promise<string> {
    this.ensureContract();
    
    try {
      console.log(`🔒 Closing proposal ${proposalId}...`);
      const tx = await this.contract!.closeProposal(proposalId);
      
      console.log('⏳ Waiting for transaction confirmation...');
      await tx.wait();
      
      console.log(`✅ Proposal closed! TX: ${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      console.error('❌ Blockchain error:', error.message);
      throw new Error(`Failed to close proposal: ${error.message}`);
    }
  }

  // Get wallet address
  getWalletAddress(): string {
    return this.wallet.address;
  }
}

export default new BlockchainService();
