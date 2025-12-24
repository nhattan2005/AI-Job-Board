const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ Password Hash for "password123":');
    console.log(hash);
    console.log('\n📋 Copy hash này vào database.sql\n');
}

generateHash();