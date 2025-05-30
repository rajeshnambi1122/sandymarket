import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000; // 3 seconds
  private onNewOrderCallback: ((order: any) => void) | null = null;
  private readonly wsUrl = 'wss://api.sandysmarket.net/ws';

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No auth token found, cannot connect to WebSocket');
        return;
      }

      // Replace with your WebSocket server URL
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        // Send authentication message
        this.ws?.send(JSON.stringify({
          type: 'auth',
          token
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_order' && this.onNewOrderCallback) {
            this.onNewOrderCallback(data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectTimeout);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  public onNewOrder(callback: (order: any) => void) {
    this.onNewOrderCallback = callback;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService(); 