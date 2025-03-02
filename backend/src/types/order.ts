export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  id: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  items: OrderItem[];
} 