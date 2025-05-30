export interface Order {
  _id: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
} 