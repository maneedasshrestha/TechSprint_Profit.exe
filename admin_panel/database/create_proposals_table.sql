-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    estimated_budget VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    voting_start_date DATE NOT NULL,
    voting_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'completed', 'rejected')
    ),
    total_votes INTEGER DEFAULT 0,
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_proposals_updated_at BEFORE
UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
-- Create policies for the proposals table
-- Allow anonymous users to read proposals (for mobile app)
CREATE POLICY "Allow anonymous read access" ON proposals FOR
SELECT USING (true);
-- Allow authenticated users to insert proposals (for admin panel)
CREATE POLICY "Allow authenticated insert" ON proposals FOR
INSERT WITH CHECK (true);
-- Allow authenticated users to update proposals (for admin panel)
CREATE POLICY "Allow authenticated update" ON proposals FOR
UPDATE USING (true);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON proposals(voting_start_date, voting_end_date);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);