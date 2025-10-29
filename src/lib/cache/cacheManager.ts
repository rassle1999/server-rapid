import NodeCache from "node-cache";
// import Redis from "ioredis";

// const redis = new Redis();
const localCache = new NodeCache({ stdTTL: 600 }); // 60 seconds

export async function getCache(key: string) {
  const local = localCache.get(key);
  if (local) return local;
}

export async function setCache(key: string, value: any, ttl = 600) {
  localCache.set(key, value, ttl);
}