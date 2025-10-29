import { setCache, getCache } from "./cacheManager";
import { tokenDatabyVolume ,tokenDatabyMarketCap} from "../data/tokenData";
import { BATCH_SIZE,PAGE_SIZE } from "../basic/constant/constant";
export function setVolumeStartIndex(index: number) {
    setCache("startIndex_volume", index);
}
export function setMarketCapStartIndex(index: number) {
    setCache("startIndex_marketcap",index)
;}
export async function startCacheWarmer(mode: string) {
    while (true) {
        const cached_volume = await getCache("startIndex_volume");
        const startIndex_volume = cached_volume ? Number(cached_volume) : 0;
        const data_volume = await tokenDatabyVolume(startIndex_volume, BATCH_SIZE * PAGE_SIZE);
        console.log("cache volume data:",data_volume.length);
        await setCache("token_volume_",JSON.stringify(data_volume));

        const cached_marketcap = await getCache("startIndex_marketcap");
        const startIndex_marketcap = cached_marketcap ? Number(cached_marketcap) : 0;
        const data_marketcap = await tokenDatabyMarketCap(startIndex_marketcap,BATCH_SIZE * PAGE_SIZE);
        console.log("cache marketcap data:",data_marketcap.length);
        await setCache("token_marketcap_",JSON.stringify(data_marketcap));
        console.log("Cache warm-up completed. Sleeping...");
        await new Promise(r => setTimeout(r, 60_000)); 
    }
}