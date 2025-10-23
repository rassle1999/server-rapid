import { ethers } from "ethers";
import pLimit from "p-limit";
import { MongoClient } from "mongodb";

export const test = async () => {
    const provider = new ethers.providers.JsonRpcProvider({url:"https://sparkling-billowing-breeze.base-mainnet.quiknode.pro/cac97de656091bc1033f00a4749869ed88b45610/",timeout: 3600000});
    // const mongo = new MongoClient("mongodb://localhost:27017");
    // await mongo.connect();
    // const swaps = mongo.db("base_swaps").collection("swaps");

    const SWAP_TOPIC = "0x27439ca78cbbfdc218b84286a2b2b9c18b462f123318628f67cdc12feb059b85";
    const STEP = 5;
    const CONCURRENCY = 10;
    const START_BLOCK = 35909969;
    const END_BLOCK = 36870000;

    const limit = pLimit(CONCURRENCY);
    const tasks = [];

    for (let i = START_BLOCK; i <= END_BLOCK; i += STEP) {
        tasks.push(limit(async () => {
            const logs = await provider.getLogs({
                fromBlock: i,
                toBlock: i + STEP - 1,
                topics: [SWAP_TOPIC],
            });
            // if (logs.length) await swaps.insertMany(logs, { ordered: false });
            console.log(`✅ ${i}-${i + STEP - 1}: ${logs.length} logs`);
        }));
    }
    await Promise.all(tasks);
}