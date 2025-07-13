import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.connect().then(() => {
    console.log("Redis client connected successfully");
}).catch((error) => {
    console.error("Error connecting to Redis:", error);
});

export default client;
