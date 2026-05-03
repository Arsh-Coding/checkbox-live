const bcrypt = require("bcrypt");
const { redisClient } = require("../config/redis");

const USERS_KEY = "admin_users";

async function seedUsers() {
  await redisClient.connect();
  
  const users = {
    alice: "password",
    bob: "bob123",
    charlie: "charlie123",
    arshpreet: "arsh"
  };

  for (const [username, password] of Object.entries(users)) {
    const hash = await bcrypt.hash(password, 10);
    await redisClient.hSet(USERS_KEY, username, hash);
    console.log(`✓ Added user: ${username}`);
  }

  await redisClient.quit();
  console.log("Seeding complete");
}

seedUsers().catch(console.error);