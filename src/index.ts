import express, { Request, Response } from "express";
import { getStreamInformation } from "./lib/data/information";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { client } from './lib/basic/mongoClient';
import router1 from "./route/data";
import router2 from "./route/post";
import { verify_token } from "./lib/post/verify";
const app = express();
const PORT = Number(process.env.PORT) || 5010;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Node backend!");
});
app.use("/", router1);
app.use("/", router2);

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
    console.log("block:", lgs[0].number);
    let token_row: any[] = [];
    let swap_row: any[] = [];
    await Promise.all(lgs.map(async (lg: any) => {
      if (lg.type == 0) {
        const token_info = await getStreamInformation(lg);
        verify_token(lg,token_info);
        token_row.push(token_info);
      }
      else swap_row.push(await getStreamInformation(lg));
    }));
    if (token_row.length > 0) {
      // console.log("Token:", token_row);
      // broadcast({type:0,event:token_row});
      // client.db("database1").collection("tokens_real").insertMany(token_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
    if (swap_row.length > 0) {
      // console.log("Swap:", swap_row);
      // broadcast({type:1,event:swap_row});
      // client.db("database1").collection("swaps_real").insertMany(swap_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
  }
  res.send("Ok");
})
server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await client.connect();
  console.log("Connected successfully to server");
});
