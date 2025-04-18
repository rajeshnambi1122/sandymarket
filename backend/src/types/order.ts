export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
  size?: string;
}

export interface OrderDetails {
  id: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  items: OrderItem[];
} 