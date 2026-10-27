const bcrypt = require('bcrypt');

async function test() {
  const hash1 = await bcrypt.hash('mypassword123', 10);
  const hash2 = await bcrypt.hash('mypassword123', 10);

  console.log('hash1:', hash1);
  console.log('hash2:', hash2);
  console.log('correct password:', await bcrypt.compare('mypassword123', hash1));
  console.log('wrong password:', await bcrypt.compare('wrongpassword', hash1));
}

test();