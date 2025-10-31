import express, { Request, Response } from "express";
import { getSwapDatabyToken } from "../lib/data/swapData";
const router_price = express.Router();
router_price.get("/price/:token/:mode", async (req: Request, res: Response) => {
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
  try {
    const priceData = await getSwapDatabyToken(token, now, step, count, left);
    res.send({ price: priceData });
  } catch (error) {
    console.log("error:",error);
    res.send({ price: [] });
  }
});
export default router_price;