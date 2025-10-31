import express, { Request, Response } from "express";
import { client } from '../lib/basic/database/mongoClient';
import { getSwapDatabyToken } from "../lib/data/swapData";
import { tokenDatabyDate, tokenDatabyAddress} from "../lib/data/tokenData";
import { getCacheVolumeData, getCacheMarketCapData, getTrendingCacheData } from "../lib/data/cacheData";
const router_token = express.Router();
router_token.get("/tokenCount/:search1", async (req: Request, res: Response) => {
  const { search1 } = req.params;
  const search = search1.slice(7);
  const tokenCount = (await client.db("database1").collection("tokens_real")
    .aggregate([{
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { symbol: { $regex: search, $options: "i" } }
        ]
      }
    }]).toArray()).length;
  res.send({ tokenCount: tokenCount });
});
router_token.get("/tokens/:page/:mode/:search1", async (req: Request, res: Response) => {
  const { page, mode, search1 } = req.params;
  const search = search1.slice(7);
  let tokens, tokenData;
  if (mode == "volume") {
    tokenData = await getCacheVolumeData(page, search);
  }
  else if (mode == "marketCap") {
    tokenData = await getCacheMarketCapData(page, search);
  }
  else {
    tokenData = await tokenDatabyDate((parseInt(page)-1)*6,6, search);
  }
  res.send({ tokens: tokenData });
});
router_token.get("/trending", async (req: Request, res: Response) => {
  const tokenData = await getTrendingCacheData();
  res.send({ tokens: tokenData });
})
router_token.get("/token/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  const token = await tokenDatabyAddress(address);
  res.send({ token: token });
})
router_token.get("/state/:count",async(req: Request, res:Response)=>{
  const {count} =req.params;
  const tokenData = await tokenDatabyDate(0,parseInt(count));
  res.send({ tokens: tokenData});
})
export default router_token;