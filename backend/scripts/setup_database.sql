-- Drop existing tables if they exist
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;

-- Create proposals table with blockchain columns
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  creator_id TEXT,
  blockchain_tx_hash TEXT,
  proposal_blockchain_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  blockchain_tx_hash TEXT NOT NULL,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- Create indexes for better performance
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_blockchain_id ON proposals(proposal_blockchain_id);
CREATE INDEX idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (adjust for production)
CREATE POLICY "Allow all operations on proposals" ON proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true) WITH CHECK (true);
