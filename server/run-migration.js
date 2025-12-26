/**
 * Migration Script: Run Banner Table Migration
 * This script creates the banners table in your database
 * Usage: node run-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use DATABASE_URL for Neon/cloud databases or individual params for local
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting migration...\n');
        
        // Read SQL file
        const sqlFile = path.join(__dirname, 'migrations', 'add-banners-table.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Execute migration
        await client.query(sql);
        
        console.log('\n✅ Migration completed successfully!');
        console.log('📊 You can now manage banners from: /admin/banners\n');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nDetails:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration();
