import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Order } from '../models/Order';

interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

declare global {
  var httpServer: Server;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      const authenticatedWs = ws as AuthenticatedWebSocket;
      authenticatedWs.isAlive = true;

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'auth' && data.token) {
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as { id: string };
            authenticatedWs.userId = decoded.id;
            this.clients.set(decoded.id, authenticatedWs);
          }
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          ws.close();
        }
      });

      ws.on('close', () => {
        if (authenticatedWs.userId) {
          this.clients.delete(authenticatedWs.userId);
        }
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const authenticatedWs = ws as AuthenticatedWebSocket;
        if (!authenticatedWs.isAlive) {
          return ws.terminate();
        }
        authenticatedWs.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public sendNewOrderNotification(order: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new_order',
          data: order
        }));
      }
    });
  }
}

export const wsService = new WebSocketService(global.httpServer); 