export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    toppings?: string[];
    size?: string;
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
    cookingInstructions?: string; // Optional cooking instructions
    deliveryType?: "pickup" | "door-delivery"; // Delivery method
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
    cookingInstructions?: string; // Optional cooking instructions
    deliveryType?: "pickup" | "door-delivery"; // Delivery method
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

export interface GasPrice {
    type: string;
    price: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    className?: string;
}

export interface AdminStatsProps {
    orders: Order[];
}

export interface AdminRouteProps {
    children: React.ReactNode;
}

export interface CartItem {
    name: string;
    quantity: number;
    price: number;
    size?: string;
    toppings?: string[];
}

export interface ErrorState {
    status: number | null;
    message: string;
}
