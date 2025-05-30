import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Order } from '../models/Order';

interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

interface OrderData {
  id: string;
  customerName: string;
  email: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

declare global {
  var httpServer: Server;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    console.log('Initializing WebSocket server...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: false // Disable compression for better performance
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection from:', req.socket.remoteAddress);
      
      const authenticatedWs = ws as AuthenticatedWebSocket;
      authenticatedWs.isAlive = true;

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'auth' && message.token) {
            const decoded = jwt.verify(message.token, process.env.JWT_SECRET!) as { id: string };
            authenticatedWs.userId = decoded.id;
            this.clients.set(decoded.id, authenticatedWs);
            console.log('Client authenticated:', decoded.id);
          }
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          ws.close();
        }
      });

      ws.on('close', () => {
        if (authenticatedWs.userId) {
          this.clients.delete(authenticatedWs.userId);
          console.log('Client disconnected:', authenticatedWs.userId);
        }
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const authenticatedWs = ws as AuthenticatedWebSocket;
        if (!authenticatedWs.isAlive) {
          console.log('Terminating inactive connection');
          return ws.terminate();
        }
        authenticatedWs.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized');
  }

  public sendNewOrderNotification(order: OrderData) {
    console.log('Sending new order notification to', this.clients.size, 'clients');
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