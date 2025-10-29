import { getCache } from "../cache/cacheManager";
import { BATCH_SIZE, PAGE_SIZE } from "../basic/constant";
import { setStartIndex } from "../cache/cacheWarmer";
import { tokenDatabyVolume } from "./tokenData";
export const getCacheData = async (page: string, search?: string) => {
    const startIndex = parseInt(page) - BATCH_SIZE / 2 > 0 ? parseInt(page) - BATCH_SIZE / 2 : 0;
    setStartIndex(startIndex);
    const cached = String(await getCache("token_volume_"));
    console.log("JSON:",cached);
    const data = cached ? JSON.parse(cached) : [];
    const tokenData = data.slice((parseInt(page)-1)*6, parseInt(page)*6);
    if(search && search != ""){
        let tokenSearchData = tokenData.filter((t:any) => t.name.includes(search));
        if(tokenSearchData.length<PAGE_SIZE){
            tokenSearchData = tokenDatabyVolume((parseInt(page)-1)*PAGE_SIZE,PAGE_SIZE,search);
        }
        return tokenSearchData;
    }
    return tokenData;
}
export const getTrendingCacheData = async() =>{
    const cached = String(await getCache("token_volume_"));
    const data = cached ? JSON.parse(cached) : [];
    const tokenData = data.slice(0, 5);
    return tokenData;
}