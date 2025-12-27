const { Client } = require('pg');
require('dotenv').config();

const runMigration = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
            ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Online',
            ADD COLUMN IF NOT EXISTS meeting_link TEXT,
            ADD COLUMN IF NOT EXISTS notes TEXT;
        `;

        await client.query(sql);
        console.log('✅ Migration completed successfully!');

        // Verify columns
        const checkResult = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'interviews'
            AND column_name IN ('duration_minutes', 'location', 'meeting_link', 'notes')
            ORDER BY column_name;
        `);

        console.log('\n✅ Verified columns:');
        checkResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await client.end();
    }
};

runMigration();
