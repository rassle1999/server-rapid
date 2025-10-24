import express, { Request, Response } from "express";
import { client } from '../../lib/basic/mongoClient';
import { getSwapDatabyToken } from "../../lib/data/swapData";
const router1 = express.Router();
router1.get("/tokenCount", async (req: Request, res: Response) => {
  const tokenCount = (await client.db("database1").collection("tokens_real").find({}).toArray()).length;
  res.send({ tokenCount: tokenCount });
});
router1.get("/tokens/:page/:mode", async (req: Request, res: Response) => {
  const { page, mode } = req.params;
  let tokens;
  if(mode=="volume")
  {
    tokens = await client
    .db("database1")
    .collection("tokens_real")
    .aggregate([
    {
      $addFields: {
        totalSupplyNum: { $toDouble: "$totalSupply" }, // convert string → number
      },
    },
    {
      $sort: { totalSupplyNum: 1 }, // sort numerically
    },
    {
      $skip: (parseInt(page) - 1) * 6,
    },
    {
      $limit: 6,
    },
  ])
  .toArray();
  }
  else{
    tokens = await client
    .db("database1")
    .collection("tokens_real")
    .find({})
    .sort({ createdAt: 1 })
    .skip((parseInt(page) - 1) * 6)
    .limit(6)
    .toArray();
  }
  const tokenAddresses = tokens.map(t => new RegExp(`^${t.address}$`, "i"));

  const now = Date.now() / 1000;

  // Get latest swaps
  const latestSwaps = await client.db("database1")
    .collection("swaps_real")
    .aggregate([
      { $match: { token: { $in: tokenAddresses } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$token", swap: { $first: "$$ROOT" } } }
    ])
    .toArray();

  // Get swaps from 24h before
  const swapsBefore = await client.db("database1")
    .collection("swaps_real")
    .aggregate([
      {
        $match: {
          token: { $in: tokenAddresses },
          date: { $lt: now - 24 * 60 * 60 }
        }
      },
      { $sort: { date: -1 } },
      { $group: { _id: "$token", swap: { $first: "$$ROOT" } } }
    ])
    .toArray();
  const latestMap = Object.fromEntries(
    latestSwaps.map(s => [s._id.toLowerCase(), s.swap])
  );
  const beforeMap = Object.fromEntries(
    swapsBefore.map(s => [s._id.toLowerCase(), s.swap])
  );

  const tokenData = tokens.map(token => {
    const addr = token.address.toLowerCase();
    const swap = latestMap[addr];
    const swapBefore = beforeMap[addr];

    const price = parseFloat(swap?.price || 0) / 1e18;
    const oldPrice = parseFloat(swapBefore?.price || 0) / 1e18;

    return {
      id:token.address,
      name:token.name,
      symbol:token.symbol,
      image:token.uriData?.image,
      price,
      priceChange: price - oldPrice,
      marketCap: (parseFloat(swap?.price || 0) * parseFloat(token.totalSupply || 0)) / 1e36,
      createdAt: token.createdAt,
      address:token.address
    };
  });
  res.send({ tokens: tokenData });
});
router1.get("/price/:token/:mode",async (req: Request, res: Response) => {
  const {token,mode} =req.params;
  const now =Date.now()/1000;
  let step=300,count=13,left =now%step;
  if(mode == "1h"){
    step=300,count=13,left =now%step;
  }
  if(mode == "1D"){
    step=3600,count=25,left =now%step;
  }
  if(mode == "1M"){
    step=3600*24,count=31,left =now%step;
  }
  const priceData=await getSwapDatabyToken(token,now,step,count,left);
  res.send({price:priceData});
});
export default router1;