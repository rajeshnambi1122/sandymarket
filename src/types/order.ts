export interface PizzaOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "delivered";
  createdAt: Date;
}
