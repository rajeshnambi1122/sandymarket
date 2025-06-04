export interface Order {
  _id: number;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  size?: string;
  toppings?: string[];
  _id?: string;
} 