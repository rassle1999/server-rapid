import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

class WebSocketManager {
  private static instance: WebSocketManager;
  private clients = new Set<WebSocket>();
  private wss: WebSocketServer | null = null;

  private constructor() {}

  static getInstance() {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  init(server: Server) {
    if (this.wss) return this.wss; // already initialized

    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws) => this.handleConnection(ws));
    console.log("✅ WebSocket server initialized");
    return this.wss;
  }

  private handleConnection(ws: WebSocket) {
    this.clients.add(ws);
    console.log("Client connected:", this.clients.size);
    ws.on("close", () => {
      this.clients.delete(ws);
      console.log("Client disconnected:", this.clients.size);
    });
  }

  broadcast(event: any) {
    const msg = JSON.stringify(event);
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg);
      }
    }
  }

  getClients() {
    return this.clients;
  }
}

export const websocketManager = WebSocketManager.getInstance();