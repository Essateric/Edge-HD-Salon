import bcrypt from 'bcryptjs';

// Create a new hash
async function generateHash() {
  const plainPassword = 'password123';
  const hash = await bcrypt.hash(plainPassword, 10);
  
  console.log(`Password: ${plainPassword}`);
  console.log(`Hash: ${hash}`);
  
  // Verify it works
  const result = await bcrypt.compare(plainPassword, hash);
  console.log(`Verify: ${result}`);
}

generateHash();