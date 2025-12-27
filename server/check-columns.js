const db = require('./src/config/database');

async function checkColumns() {
    try {
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
                'company_email',
                'company_phone',
                'social_linkedin',
                'social_facebook',
                'social_twitter'
            )
            ORDER BY column_name
        `);
        
        console.log('\n✅ Columns found in database:');
        result.rows.forEach(row => {
            console.log('  -', row.column_name);
        });
        
        if (result.rows.length === 0) {
            console.log('\n❌ No new columns found! Migration may have failed.');
        } else if (result.rows.length < 10) {
            console.log(`\n⚠️ Only ${result.rows.length}/10 columns found. Some may be missing.`);
        } else {
            console.log('\n✅ All columns successfully created!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error checking columns:', error.message);
        process.exit(1);
    }
}

checkColumns();
