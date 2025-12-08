const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrate() {
  console.log('Starting migration: Add createdBy to candidates...');
  
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const candidates = db.collection('candidates');
    const users = db.collection('users');
    
    // Count candidates without createdBy
    const count = await candidates.countDocuments({ createdBy: { $exists: false } });
    console.log(`Found ${count} candidates without createdBy field`);
    
    if (count === 0) {
      console.log('No migration needed. All candidates have createdBy field.');
      return;
    }
    
    // Get first admin user
    const adminUser = await users.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      console.log('\nTo create an admin user, use the API:');
      console.log('POST /auth/register');
      console.log('{ "email": "admin@test.com", "password": "AdminPass123!", "role": "admin" }');
      process.exit(1);
    }
    
    console.log(`Assigning all candidates to admin: ${adminUser.email}`);
    
    // Update all candidates without createdBy
    const result = await candidates.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminUser._id.toString() } }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} candidates`);
    console.log('\nMigration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

migrate();
