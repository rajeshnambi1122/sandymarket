import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Order } from '../models/Order';

class WebSocketService {
  private wss: WebSocketServer;
  private adminClients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      // Handle authentication
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'auth' && data.token) {
            // Verify token and check if user is admin
            // If admin, add to adminClients
            this.adminClients.add(ws);
            console.log('Admin client authenticated');
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.adminClients.delete(ws);
        console.log('Client disconnected');
      });
    });
  }

  public sendNewOrderNotification(order: Order) {
    const notification = {
      type: 'new_order',
      data: {
        orderId: order._id,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt
      }
    };

    // Send to all connected admin clients
    this.adminClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }
}

export let wsService: WebSocketService;

export const initializeWebSocket = (server: Server) => {
  wsService = new WebSocketService(server);
}; 