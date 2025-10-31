import express, { Request, Response } from "express";
import { getStreamInformation } from "./lib/post/information";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { client } from './lib/basic/database/mongoClient';
import router_token from "./route/router_token";
import router_price from "./route/router_price";
import router_upload from "./route/router_upload";
import { verify_swap} from "./lib/post/verify";
import { startCacheWarmer } from "./lib/cache/cacheWarmer";
const app = express();
const PORT = Number(process.env.PORT) || 5010;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Node backend!");
});
app.use("/", router_token);
app.use("/", router_price);
app.use("/", router_upload);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Client connected");
  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });
});
function broadcast(event: any) {
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }
}
app.post("/webhook", async (req: Request, res: Response) => {
  if (req.body.logs.length > 0) {
    var lgs = req.body.logs;
    let token_row: any[] = [];
    let swap_row: any[] = [];
    await Promise.all(lgs.map(async (lg: any) => {
      if (lg.type == 0) {
        const token_info = await getStreamInformation(lg);
        token_row.push(token_info);
      }
      else {
        const swap_info = await getStreamInformation(lg);
        const isValid = await verify_swap(lg, swap_info);
        if (isValid == true)
          swap_row.push(swap_info);
      }
    }));
    if (token_row.length > 0) {
      broadcast({ type: 0 });
      client.db("database1").collection("tokens_real").insertMany(token_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
    if (swap_row.length > 0) {
      broadcast({ type: 1 });
      client.db("database1").collection("swaps_real").insertMany(swap_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
  }
  res.send("Ok");
})
server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await client.connect();
  startCacheWarmer("volume");
  console.log("Connected successfully to server");
});
