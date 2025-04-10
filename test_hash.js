const bcrypt = require('bcryptjs');

const password = 'test123';
bcrypt.hash(password, 10).then(hash => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
});