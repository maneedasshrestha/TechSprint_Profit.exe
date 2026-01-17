// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProposalVoting {
    struct Proposal {
        uint256 id;
        string title;
        address creator;
        uint256 voteCount;
        uint256 endsAt;
        bool active;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, string title, address creator, uint256 endsAt);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 timestamp);
    event ProposalClosed(uint256 indexed proposalId, uint256 finalVoteCount);
    
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId < proposalCount, "Proposal does not exist");
        _;
    }
    
    modifier proposalActive(uint256 _proposalId) {
        require(proposals[_proposalId].active, "Proposal is not active");
        require(block.timestamp < proposals[_proposalId].endsAt, "Proposal has ended");
        _;
    }
    
    function createProposal(string memory _title, uint256 _duration) public returns (uint256) {
        uint256 proposalId = proposalCount;
        uint256 endsAt = block.timestamp + _duration;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: _title,
            creator: msg.sender,
            voteCount: 0,
            endsAt: endsAt,
            active: true
        });
        
        proposalCount++;
        
        emit ProposalCreated(proposalId, _title, msg.sender, endsAt);
        
        return proposalId;
    }
    
    function vote(uint256 _proposalId) 
        public 
        proposalExists(_proposalId) 
        proposalActive(_proposalId) 
    {
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");
        
        proposals[_proposalId].voteCount++;
        hasVoted[_proposalId][msg.sender] = true;
        
        emit VoteCast(_proposalId, msg.sender, block.timestamp);
    }
    
    function closeProposal(uint256 _proposalId) 
        public 
        proposalExists(_proposalId) 
    {
        require(
            msg.sender == proposals[_proposalId].creator || 
            block.timestamp >= proposals[_proposalId].endsAt,
            "Only creator can close before end time"
        );
        
        proposals[_proposalId].active = false;
        
        emit ProposalClosed(_proposalId, proposals[_proposalId].voteCount);
    }
    
    function getProposal(uint256 _proposalId) 
        public 
        view 
        proposalExists(_proposalId) 
        returns (
            uint256 id,
            string memory title,
            address creator,
            uint256 voteCount,
            uint256 endsAt,
            bool active
        ) 
    {
        Proposal memory p = proposals[_proposalId];
        return (p.id, p.title, p.creator, p.voteCount, p.endsAt, p.active);
    }
    
    function hasUserVoted(uint256 _proposalId, address _voter) 
        public 
        view 
        proposalExists(_proposalId) 
        returns (bool) 
    {
        return hasVoted[_proposalId][_voter];
    }
}
