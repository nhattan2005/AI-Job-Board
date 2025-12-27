const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('\n🚀 Running migration: add-employer-fields.sql');
        
        // Đọc file SQL
        const sqlPath = path.join(__dirname, 'migrations', 'add-employer-fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Tách các câu lệnh SQL (bỏ comment)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));
        
        console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);
        
        // Chạy từng câu lệnh
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;
            
            console.log(`   [${i + 1}/${statements.length}] Executing...`);
            
            try {
                await db.query(statement);
                console.log(`   ✅ Success`);
            } catch (err) {
                // Bỏ qua lỗi "column already exists"
                if (err.message.includes('already exists')) {
                    console.log(`   ⚠️  Already exists (skipped)`);
                } else {
                    throw err;
                }
            }
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        
        // Verify
        console.log('🔍 Verifying columns...\n');
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
        
        console.log('✅ Columns found:');
        result.rows.forEach(row => {
            console.log('  -', row.column_name);
        });
        
        if (result.rows.length === 8) {
            console.log('\n🎉 All 8 new columns successfully created!\n');
        } else {
            console.log(`\n⚠️  Warning: Only ${result.rows.length}/8 columns created\n`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
