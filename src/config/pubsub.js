const { createClient } = require("redis");

const pubClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.error("Redis pub error:", err);
});

subClient.on("error", (err) => {
  console.error("Redis sub error:", err);
});

async function connectPubSub() {
  if (!pubClient.isOpen) {
    await pubClient.connect();
  }

  if (!subClient.isOpen) {
    await subClient.connect();
  }
}

const CHANNEL = "checkbox_updates";

async function publishUpdate(payload) {
  await pubClient.publish(CHANNEL, JSON.stringify(payload));
}

async function subscribeToUpdates(handler) {
  await subClient.subscribe(CHANNEL, (message) => {
    handler(JSON.parse(message));
  });
}

module.exports = {
  connectPubSub,
  publishUpdate,
  subscribeToUpdates,
};