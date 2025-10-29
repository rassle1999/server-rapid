import { client } from "../basic/mongoClient";
import { setCache, getCache } from "./cacheManager";
import { tokenDatabyVolume } from "../data/tokenData";
import { BATCH_SIZE,PAGE_SIZE } from "../basic/constant";
export function setStartIndex(index: number) {
    setCache("startIndex", index);
}
export async function startCacheWarmer(mode: string) {
    while (true) {
        const cached = await getCache("startIndex");
        const startIndex = cached ? Number(cached) : 0;
        const data = await tokenDatabyVolume(startIndex, BATCH_SIZE * PAGE_SIZE);
        console.log("cache data:",data.length);
        await setCache("token_volume_",JSON.stringify(data));

        
        console.log("Cache warm-up completed. Sleeping...");
        await new Promise(r => setTimeout(r, 60_000)); // wait 1 minute before next refresh
    }
}