export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  id: string;
  customerEmail: string;
  totalAmount: number;
  items: OrderItem[];
} 