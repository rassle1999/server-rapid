import express, { Request, Response } from "express";
import { client } from '../../lib/basic/mongoClient';
import { getSwapDatabyToken } from "../../lib/data/swapData";
import { tokenDatabyDate, tokenDatabyMarketCap,tokenDatabyVolume } from "../../lib/data/tokenData";
const router1 = express.Router();
router1.get("/tokenCount", async (req: Request, res: Response) => {
  const tokenCount = (await client.db("database1").collection("tokens_real").find({}).toArray()).length;
  res.send({ tokenCount: tokenCount });
});
router1.get("/tokens/:page/:mode", async (req: Request, res: Response) => {
  const { page, mode } = req.params;
  let tokens, tokenData;
  if (mode == "volume") {
    console.log("******************Volume ***********************");
    tokenData = await tokenDatabyVolume(page);
  }
  else if (mode == "marketCap") {
    console.log("******************Market Cap ***********************");
    tokenData = await tokenDatabyMarketCap(page); 
  }
  else {
    tokenData = await tokenDatabyDate(page);
  }
  res.send({ tokens: tokenData });
});
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
export default router1;