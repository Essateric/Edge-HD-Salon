import bcrypt from 'bcryptjs';
import { connect } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from './shared/schema.js';

// Sample password for all users except 'test'
const samplePassword = "password123";

async function fixPasswordHashes() {
  console.log("Updating password hashes to use $2b$ format...");

  // Connect to database
  const sql = connect({
    connectionString: process.env.DATABASE_URL
  });

  const db = drizzle(sql, { schema: { users } });

  // Get all users
  const allUsers = await db.select().from(users);
  
  console.log(`Found ${allUsers.length} users to update`);

  for (const user of allUsers) {
    // Skip the test user we've already fixed
    if (user.username === 'test') {
      console.log(`Skipping user ${user.username} as it's already fixed`);
      continue;
    }

    // Create a new hash with bcrypt that will use $2b$ format
    const newHash = await bcrypt.hash(samplePassword, 10);
    
    // Update the user's password
    await db.update(users)
      .set({ password: newHash })
      .where(db.eq(users.id, user.id));
    
    console.log(`Updated hash for user ${user.username}`);
  }

  console.log("All user passwords have been updated to use $2b$ format");
  console.log("Default password for all users (except 'test'): password123");

  process.exit(0);
}

fixPasswordHashes().catch(error => {
  console.error("Error updating password hashes:", error);
  process.exit(1);
});