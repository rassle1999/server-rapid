import express, { Request, Response } from "express";
import { getStreamInformation } from "./lib/post/information";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { client } from './lib/basic/database/mongoClient';
import router_token from "./route/router_token";
import router_price from "./route/router_price";
import router_upload from "./route/router_upload";
import router_webhook from "./route/router_webhook";
import { verify_swap} from "./lib/post/verify";
import { startCacheWarmer } from "./lib/cache/cacheWarmer";
import { websocketManager } from "./lib/webSocket/webSocketManager";
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

websocketManager.init(server);
app.use("/",router_webhook)
server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await client.connect();
  startCacheWarmer("volume");
  console.log("Connected successfully to server");
});
