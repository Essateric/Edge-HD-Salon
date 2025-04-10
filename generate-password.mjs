// Script to generate a bcrypt hash for a password
import bcrypt from 'bcryptjs';

// Get the password from command line arguments
const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as an argument!');
  console.error('Usage: node generate-password.mjs your_password');
  process.exit(1);
}

// Generate hash with salt rounds of 10
const hashedPassword = await bcrypt.hash(password, 10);

console.log('\nPassword:', password);
console.log('Bcrypt Hash:', hashedPassword);
console.log('\nYou can now update this hash in database or storage');