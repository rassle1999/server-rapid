import express, { Request, Response } from "express";
import { getStreamInformation } from "../lib/post/information";
import { verify_swap } from "../lib/post/verify";
import { client } from "../lib/basic/database/mongoClient";
import { websocketManager } from "../lib/webSocket/webSocketManager";
const router_webhook = express.Router();
router_webhook.post("/webhook", async (req: Request, res: Response) => {
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
      websocketManager.broadcast({ type: 0 });
      client.db("database1").collection("tokens_real").insertMany(token_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
    if (swap_row.length > 0) {
      websocketManager.broadcast({ type: 1 });
      client.db("database1").collection("swaps_real").insertMany(swap_row).catch(err => { console.error("MongoDB insertMany error:", err); });
    }
  }
  res.send("Ok");
});
export default router_webhook;