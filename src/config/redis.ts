import {createClient} from "redis"
import { RedisCommandArgument, createNodeRedisClient } from "bullmq";

const redisClient = createClient({
    url: process.env.REDIS_URL!
});

redisClient.on("error",(error)=>{
    console.log("Redis Client Error ",error)
})

export const bullmqConnection = createNodeRedisClient(redisClient)
export default redisClient