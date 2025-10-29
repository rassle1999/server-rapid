import express, { Request, Response } from "express";
import { client } from '../../lib/basic/database/mongoClient';
import { getSwapDatabyToken } from "../../lib/data/swapData";
import { tokenDatabyDate, tokenDatabyAddress, getMarketCapData } from "../../lib/data/tokenData";
import { getCacheVolumeData, getCacheMarketCapData, getTrendingCacheData } from "../../lib/data/cacheData";
const router1 = express.Router();
router1.get("/tokenCount/:search1", async (req: Request, res: Response) => {
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
router1.get("/tokens/:page/:mode/:search1", async (req: Request, res: Response) => {
  const { page, mode, search1 } = req.params;
  const search = search1.slice(7);
  console.log("search:", search);
  let tokens, tokenData;
  if (mode == "volume") {
    tokenData = await getCacheVolumeData(page, search);
  }
  else if (mode == "marketCap") {
    tokenData = await getCacheMarketCapData(page, search);
  }
  else {
    tokenData = await tokenDatabyDate(page, search);
  }
  res.send({ tokens: tokenData });
});
router1.get("/trending", async (req: Request, res: Response) => {
  const tokenData = await getTrendingCacheData();
  res.send({ tokens: tokenData });
})
router1.get("/token/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  const token = await tokenDatabyAddress(address);
  res.send({ token: token });
})
router1.get("/price/:token/:mode", async (req: Request, res: Response) => {
  const { token, mode } = req.params;
  const now = Date.now() / 1000;
  let step = 300, count = 13, left = now % step;
  if (mode == "1h") {
    step = 300, count = 13, left = now % step;
  }
  if (mode == "1D") {
    step = 3600, count = 25, left = now % step;
  }
  if (mode == "1M") {
    step = 3600 * 24, count = 31, left = now % step;
  }
  const priceData = await getSwapDatabyToken(token, now, step, count, left);
  res.send({ price: priceData });
});
router1.get("/dash_price", async (req: Request, res: Response) => {
  await getMarketCapData();
  res.send({ ok: 'ok' });
})
export default router1;