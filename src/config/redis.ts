import { createClient } from 'redis';
import { REDIS_URL } from '../constants';

const client = createClient({
    url: REDIS_URL,
});

client.connect().then(() => {
    console.log("Redis client connected successfully");
}).catch((error) => {
    console.error("Error connecting to Redis:", error);
});

export default client;
