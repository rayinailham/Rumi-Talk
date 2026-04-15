import fs from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function runUpdates() {
    const sqlFile = 'scripts/update_embeddings.sql';
    const content = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by BEGIN; and COMMIT; to get batches
    const batches = content.split('COMMIT;').map(b => b.trim() + (b.trim() ? '; COMMIT;' : '')).filter(b => b.length > 50);

    console.log(`Execution started. Total batches: ${batches.length}`);

    for (let i = 0; i < batches.length; i++) {
        console.log(`Executing batch ${i + 1}/${batches.length}...`);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({ query: batches[i] })
            });

            if (!response.ok) {
                const error = await response.text();
                // If rpc execute_sql_internal doesn't exist, we might need another way.
                // Supabase doesn't expose a raw SQL RPC by default.
                // I'll try calling the MCP tool instead.
                throw new Error(`Failed to execute batch ${i + 1}: ${error}`);
            }
            
            console.log(`Batch ${i + 1} completed.`);
        } catch (err) {
            console.error(err.message);
            console.log('Falling back to MCP tool for this batch if possible, or check if SQL is correct.');
            // Since I can't easily call MCP from script, I'll stop and report.
            break;
        }
    }
}

// runUpdates();
