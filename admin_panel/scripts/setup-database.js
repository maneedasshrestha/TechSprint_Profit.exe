import { supabase } from '../src/lib/supabase';

async function createProposalsTable() {
  try {
    console.log('Creating proposals table...');
    
    // Create the table
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `
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
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
          total_votes INTEGER DEFAULT 0,
          yes_votes INTEGER DEFAULT 0,
          no_votes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Proposals table created successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createProposalsTable();