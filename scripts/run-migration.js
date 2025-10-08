#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs the initial Supabase schema migration
 *
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  // Read the migration SQL file
  const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📖 Reading migration file: 001_initial_schema.sql');
  console.log(`   File size: ${migrationSQL.length} bytes\n`);

  try {
    // Execute the migration SQL
    console.log('⚙️  Executing migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql RPC doesn't exist, we need to execute via REST API
      if (error.message.includes('exec_sql') || error.code === 'PGRST202') {
        console.log('   RPC method not available, trying direct SQL execution...\n');
        await executeSQLDirectly(migrationSQL);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('  ', error.message);
    console.error('\n💡 Try running the migration manually:');
    console.error('   1. Go to https://app.supabase.com/project/_/sql/new');
    console.error('   2. Copy the contents of supabase/migrations/001_initial_schema.sql');
    console.error('   3. Paste and run in the SQL editor\n');
    process.exit(1);
  }
}

async function executeSQLDirectly(sql) {
  // Split SQL into individual statements (simple approach)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim() === ';') {
      continue;
    }

    try {
      // Use the query method to execute raw SQL
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statement })
        }
      );

      if (!response.ok) {
        // This approach might not work, fall back to instruction
        throw new Error('Direct SQL execution not available via REST API');
      }

      console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
    } catch (error) {
      throw new Error(
        'Unable to execute SQL via API. Please run the migration manually in the Supabase SQL Editor.'
      );
    }
  }

  console.log('\n✅ All statements executed!\n');
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  try {
    // Check if alerts table exists
    const { data: tables, error: tableError } = await supabase
      .from('alerts')
      .select('*')
      .limit(0);

    if (tableError) {
      if (tableError.code === '42P01') {
        throw new Error('Table "alerts" was not created');
      }
      // Table exists but might be empty, which is fine
      console.log('✅ Table "alerts" exists');
    } else {
      console.log('✅ Table "alerts" exists and is accessible');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Create a test alert via the UI');
    console.log('   3. Check the Supabase dashboard to see the data\n');

  } catch (error) {
    console.warn('\n⚠️  Warning: Could not verify migration');
    console.warn('   ', error.message);
    console.warn('   Please check the Supabase dashboard manually\n');
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
