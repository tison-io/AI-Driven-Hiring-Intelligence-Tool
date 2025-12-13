import { connect } from 'mongoose';

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    const connection = await connect(process.env.DATABASE_URL);

    // Get the users collection
    const db = connection.connection.db;
    const usersCollection = db.collection('users');

    // Drop the problematic username index
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ Dropped username_1 index successfully');
    } catch (error) {
      console.log('ℹ️ username_1 index not found or already dropped');
    }

    // Close connection
    await connection.disconnect();
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupDatabase();
}

export { cleanupDatabase };
