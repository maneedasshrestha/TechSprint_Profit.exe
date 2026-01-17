import express from 'express';
import blockchainService from '../services/blockchainService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CREATE PROPOSAL
router.post('/', async (req, res) => {
  try {
    const { title, description, image_url, duration_days, creator_id } = req.body;

    // Validate input
    if (!title || !description || !duration_days) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'description', 'duration_days']
      });
    }

    console.log('📋 Creating proposal:', title);

    // 1. Create on blockchain first
    const { proposalId, txHash } = await blockchainService.createProposal(
      title,
      duration_days
    );

    // 2. Save to Supabase with blockchain reference
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + duration_days);

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        title,
        description,
        image_url: image_url || null,
        creator_id: creator_id || null,
        blockchain_tx_hash: txHash,
        proposal_blockchain_id: proposalId,
        ends_at: endsAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Proposal created successfully!');

    res.json({ 
      success: true, 
      proposal: data,
      blockchain: {
        proposalId,
        txHash
      }
    });
  } catch (error: any) {
    console.error('❌ Error creating proposal:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create proposal' 
    });
  }
});

// CAST VOTE
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { voter_id } = req.body;

    if (!voter_id) {
      return res.status(400).json({ error: 'Missing voter_id' });
    }

    console.log(`🗳️  Processing vote for proposal ${id}...`);

    // 1. Get proposal from Supabase
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if proposal is still active
    if (proposal.status !== 'active') {
      return res.status(400).json({ error: 'Proposal is not active' });
    }

    if (new Date(proposal.ends_at) < new Date()) {
      return res.status(400).json({ error: 'Proposal voting period has ended' });
    }

    // 2. Check if already voted in Supabase
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('proposal_id', id)
      .eq('voter_id', voter_id)
      .single();

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted on this proposal' });
    }

    // 3. Cast vote on blockchain
    const txHash = await blockchainService.castVote(proposal.proposal_blockchain_id);

    // 4. Record in Supabase
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        proposal_id: id,
        voter_id,
        blockchain_tx_hash: txHash
      })
      .select()
      .single();

    if (voteError) {
      console.error('Supabase error:', voteError);
      throw voteError;
    }

    // 5. Get updated vote count from blockchain
    const blockchainProposal = await blockchainService.getProposal(proposal.proposal_blockchain_id);

    console.log('✅ Vote recorded successfully!');

    res.json({ 
      success: true, 
      vote,
      voteCount: blockchainProposal.voteCount,
      txHash
    });
  } catch (error: any) {
    console.error('❌ Error casting vote:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cast vote' 
    });
  }
});

// GET ALL PROPOSALS 
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        votes (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true,
      proposals: data 
    });
  } catch (error: any) {
    console.error('❌ Error fetching proposals:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch proposals' 
    });
  }
});

// GET SINGLE PROPOSAL WITH BLOCKCHAIN DATA
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get from Supabase
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        votes (count)
      `)
      .eq('id', id)
      .single();

    if (error || !proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Get live data from blockchain
    try {
      const blockchainData = await blockchainService.getProposal(
        proposal.proposal_blockchain_id
      );

      res.json({
        success: true,
        proposal: {
          ...proposal,
          blockchain_vote_count: blockchainData.voteCount,
          blockchain_is_active: blockchainData.active
        }
      });
    } catch (blockchainError) {
      // If blockchain fails, still return Supabase data
      console.warn('⚠️  Could not fetch blockchain data:', blockchainError);
      res.json({
        success: true,
        proposal,
        warning: 'Blockchain data unavailable'
      });
    }
  } catch (error: any) {
    console.error('❌ Error fetching proposal:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch proposal' 
    });
  }
});

// CHECK IF USER VOTED
router.get('/:id/voted/:voter_id', async (req, res) => {
  try {
    const { id, voter_id } = req.params;

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('proposal_id', id)
      .eq('voter_id', voter_id)
      .single();

    res.json({ 
      success: true,
      hasVoted: !!data 
    });
  } catch (error: any) {
    res.json({ 
      success: true,
      hasVoted: false 
    });
  }
});

export default router;
