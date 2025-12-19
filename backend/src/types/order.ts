export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
  size?: string;
}

export interface OrderDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  totalAmount: number;
  items: OrderItem[];
  cookingInstructions?: string;
  deliveryType?: "pickup" | "door-delivery";
  address?: string;
  coupon?: {
    isApplied: boolean;
    code?: string;
    discountAmount?: number;
    discountPercentage?: number;
  };
}