// Test script for blockchain voting API
const API_BASE = 'http://localhost:5000/api';

// Helper function to make requests
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Create a proposal
async function testCreateProposal() {
  console.log('\n📝 TEST 1: Creating a proposal...');
  
  const result = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Should we implement a community garden?',
      description: 'Proposal to create a community garden in Ward 5',
      image_url: 'https://example.com/garden.jpg',
      duration_days: 7,
      creator_id: 'test-user-123'
    })
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.data.proposal) {
    console.log('✅ Proposal created successfully!');
    console.log(`Proposal ID: ${result.data.proposal.id}`);
    console.log(`Blockchain Proposal ID: ${result.data.blockchain.proposalId}`);
    console.log(`Transaction Hash: ${result.data.blockchain.txHash}`);
    return result.data.proposal;
  } else {
    console.log('❌ Failed to create proposal');
    return null;
  }
}

// Test 2: Get all proposals
async function testGetAllProposals() {
  console.log('\n📋 TEST 2: Getting all proposals...');
  
  const result = await request(`${API_BASE}/proposals`);
  
  console.log('Status:', result.status);
  console.log(`Found ${result.data.proposals?.length || 0} proposals`);
  
  if (result.data.proposals && result.data.proposals.length > 0) {
    console.log('✅ Proposals retrieved successfully!');
    result.data.proposals.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.title}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Blockchain ID: ${p.proposal_blockchain_id}`);
      console.log(`   Votes: ${p.votes?.[0]?.count || 0}`);
    });
  }
  
  return result.data.proposals;
}

// Test 3: Vote on a proposal
async function testVote(proposalId, voterId) {
  console.log(`\n🗳️  TEST 3: Voting on proposal ${proposalId}...`);
  
  const result = await request(`${API_BASE}/proposals/${proposalId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      voter_id: voterId
    })
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.data.success) {
    console.log('✅ Vote cast successfully!');
    console.log(`Transaction Hash: ${result.data.txHash}`);
    console.log(`Total Votes: ${result.data.voteCount}`);
  } else {
    console.log('❌ Vote failed:', result.data.error);
  }
}

// Test 4: Get single proposal with blockchain data
async function testGetProposal(proposalId) {
  console.log(`\n🔍 TEST 4: Getting proposal ${proposalId} details...`);
  
  const result = await request(`${API_BASE}/proposals/${proposalId}`);
  
  console.log('Status:', result.status);
  
  if (result.data.proposal) {
    const p = result.data.proposal;
    console.log('✅ Proposal retrieved!');
    console.log(`Title: ${p.title}`);
    console.log(`Description: ${p.description}`);
    console.log(`Blockchain Vote Count: ${p.blockchain_vote_count}`);
    console.log(`Active: ${p.blockchain_is_active}`);
    console.log(`Ends At: ${p.ends_at}`);
  }
}

// Test 5: Check if user voted
async function testCheckVoted(proposalId, voterId) {
  console.log(`\n✓ TEST 5: Checking if user ${voterId} voted on proposal ${proposalId}...`);
  
  const result = await request(`${API_BASE}/proposals/${proposalId}/voted/${voterId}`);
  
  console.log('Status:', result.status);
  console.log(`Has Voted: ${result.data.hasVoted}`);
}

// Test 6: Try to vote twice (should fail)
async function testDoubleVote(proposalId, voterId) {
  console.log(`\n🚫 TEST 6: Trying to vote twice (should fail)...`);
  
  const result = await request(`${API_BASE}/proposals/${proposalId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      voter_id: voterId
    })
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 400) {
    console.log('✅ Correctly rejected duplicate vote!');
  } else {
    console.log('❌ Should have rejected duplicate vote');
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 BLOCKCHAIN VOTING SYSTEM - API TESTS');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Create a proposal
    const proposal = await testCreateProposal();
    
    if (!proposal) {
      console.log('\n❌ Cannot continue tests - proposal creation failed');
      return;
    }
    
    // Wait a bit for blockchain confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Get all proposals
    await testGetAllProposals();
    
    // Test 3: Vote on the proposal
    await testVote(proposal.id, 'voter-001');
    
    // Wait for vote confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Get proposal with blockchain data
    await testGetProposal(proposal.id);
    
    // Test 5: Check if user voted
    await testCheckVoted(proposal.id, 'voter-001');
    
    // Test 6: Try double voting
    await testDoubleVote(proposal.id, 'voter-001');
    
    // Test 7: Different user votes
    console.log('\n🗳️  TEST 7: Different user voting...');
    await testVote(proposal.id, 'voter-002');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Final check
    await testGetProposal(proposal.id);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the tests
runTests();
