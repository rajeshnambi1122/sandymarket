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
  address: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered";
  totalAmount: number;
  createdAt: string;
}

export type OrderStatus = Order["status"];

export type CreateOrderDTO = Omit<Order, "id" | "status" | "createdAt">;

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
