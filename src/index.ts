import express, { Request, Response } from "express";
import { getTokenData } from "./lib/tokenData";
import { getSwapData ,getSwapDatabyToken} from "./lib/swapData";
import { client } from './lib/mongoClient';
import { addImage, addJson } from "./lib/addCoin";
import { getStreamInformation } from "./lib/information";
import cors from "cors";
import multer from "multer";
import { WebSocketServer } from 'ws';
import http from "http";
const app = express();
const PORT = process.env.PORT || 5010;
const storage = multer.memoryStorage(); // or multer.diskStorage({ ... })
const upload = multer({ storage: storage });
app.use(cors());
// Increase the limit for JSON payloads
app.use(express.json({ limit: '50mb' }));

// Increase the limit for URL-encoded payloads (if you use them)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Node backend!");
});
app.get("/tokens", async (req: Request, res: Response) => {
  console.log("Get Tokens");
  const tokenData = await getTokenData();
  res.send(tokenData);
});
app.get("/swap", async (req: Request, res: Response) => {
  console.log("Get Swap");
  const swapData = await getSwapData();
  res.send(swapData);
});
app.post("/webhook", async (req: Request, res: Response) => {
  if (req.body.logs.length > 0) {
    var lgs = req.body.logs;
    console.log("block:", lgs[0].number);
    let token_row: any[] = [];
    let swap_row: any[] = [];
    await Promise.all(lgs.map(async (lg: any) => {
      if (lg.type == 0) token_row.push(await getStreamInformation(lg));
      else swap_row.push(await getStreamInformation(lg));
    }));
    if (token_row.length > 0) {
      console.log("Token:",token_row);
      client.db("database1").collection("tokens_real").insertMany(token_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
    if (swap_row.length > 0) {
      console.log("Swap:",swap_row);
      client.db("database1").collection("swaps_real").insertMany(swap_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
  }
  res.send("Ok");
})
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { name, symbol, description } = req.body;
  if (file == undefined) {
    res.send("undefined");
    return;
  }
  const publicUrl = await addJson(name, symbol, description, file);
  console.log('Received file of type:', file);
  res.send({ publicUrl: publicUrl });
});

//Changed
app.get("/tokenCount", async (req: Request, res: Response) => {
  const tokenCount = (await client.db("database1").collection("tokens_real").find({}).toArray()).length;
  res.send({ tokenCount: tokenCount });
});
app.get("/tokens/:page/:mode", async (req: Request, res: Response) => {
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
app.get("/price/:token/:mode",async (req: Request, res: Response) => {
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
})


// const server = http.createServer(app);
// const wss = new WebSocketServer({server});

// // Store connected clients
// const clients = new Set<import('ws').WebSocket>();

// wss.on("connection", (ws) => {
//   clients.add(ws);
//   console.log("Client connected");
  
//   ws.on("close", () => {
//     clients.delete(ws);
//     console.log("Client disconnected");
//   });
// });

// // Function to broadcast an event to all connected clients
// function broadcast(event: any) {
//   for (const ws of clients) {
//     if (ws.readyState === ws.OPEN) {
//       ws.send(JSON.stringify(event));
//     }
//   }
// }

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await client.connect();
  console.log("Connected successfully to server");
});