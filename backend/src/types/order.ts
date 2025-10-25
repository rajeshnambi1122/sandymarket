// Define the OrderItem interface for consistent use throughout the application
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
  size?: string;
}

// Define the OrderDetails interface used by the email service
export interface OrderDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  totalAmount: number;
  items: OrderItem[];
  cookingInstructions?: string; // Optional cooking instructions
  deliveryType?: "pickup" | "door-delivery"; // Delivery method
  address?: string; // Delivery address
} 