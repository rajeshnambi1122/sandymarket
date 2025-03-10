export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id?: string;
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered";
  totalAmount: number;
  createdAt: string;
  user?: string; // Reference to User ID
  userId?: string; // For creating orders with explicit user ID
}

export type OrderStatus = Order["status"];

export interface CreateOrderDTO {
  customerName: string;
  phone: string;
  email: string;
  address?: string;
  items: OrderItem[];
  totalAmount: number;
  userId?: string; // Optional user ID for associating with a user
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  message?: string;
}
