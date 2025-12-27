const db = require('./src/config/database');

async function addMissingColumn() {
    try {
        console.log('\n📝 Adding missing column: company_address\n');
        
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address TEXT');
        console.log('✅ Column added successfully\n');
        
        // Verify all columns
        const result = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN (
                'company_address', 
                'company_size', 
                'company_industry',
                'company_founded_year',
                'company_benefits',
                'social_linkedin',
                'social_facebook',
                'social_twitter'
            )
            ORDER BY column_name
        `);
        
        console.log('✅ All columns now in database:');
        result.rows.forEach(row => {
            console.log('  -', row.column_name);
        });
        
        if (result.rows.length === 8) {
            console.log('\n🎉 Perfect! All 8 columns exist!\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

addMissingColumn();
