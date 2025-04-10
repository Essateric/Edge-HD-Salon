import bcrypt from 'bcryptjs';
import { connect } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';

// Create a pre-hashed password for our test
const plainPassword = 'edge123';
const hashedPassword = await bcrypt.hash(plainPassword, 10);

console.log(`Plain password: ${plainPassword}`);
console.log(`Hashed password: ${hashedPassword}`);

// Connect to database
const sql = connect({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(sql, { schema });

// Create a test user
const [newUser] = await db.insert(schema.users).values({
  username: 'test',
  email: 'test@theedgesalon.com',
  password: hashedPassword,
  firstName: 'Test',
  lastName: 'User',
  roleId: 1 // Admin role
}).returning();

console.log('User created:', newUser);
console.log('You can now log in with:');
console.log('Email: test@theedgesalon.com');
console.log('Password: edge123');

// Close connection
process.exit(0);