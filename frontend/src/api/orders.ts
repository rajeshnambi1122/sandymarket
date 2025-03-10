import axios, { AxiosError } from "axios";
import { API_URL } from "@/config/api";
import {
  Order,
  OrderStatus,
  CreateOrderDTO,
  OrderResponse,
  OrdersResponse,
} from "@/types/order";

class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    throw new ApiError(
      axiosError.response?.data?.message || "An error occurred",
      axiosError.response?.status
    );
  }
  throw error;
};

const ordersApi = {
  getAllOrders: async (): Promise<Order[]> => {
    try {
      const response = await axios.get<OrdersResponse>(`${API_URL}/orders`, {
        headers: getAuthHeader(),
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus
  ): Promise<Order> => {
    try {
      const response = await axios.patch<OrderResponse>(
        `${API_URL}/orders/${orderId}`,
        { status },
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createOrder: async (orderData: CreateOrderDTO): Promise<Order> => {
    try {
      // Add user ID to the order data if available
      let enhancedOrderData = { ...orderData };
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          // Include the user ID in the order data
          if (userData && userData.id) {
            console.log("Adding user ID to order:", userData.id);
            enhancedOrderData.userId = userData.id;
          }
        }
      } catch (userDataError) {
        console.error("Error getting user data from localStorage:", userDataError);
        // Continue with original order data if there's an error
      }
      
      console.log("Sending order with data:", enhancedOrderData);
      
      const response = await axios.post<OrderResponse>(
        `${API_URL}/orders`,
        enhancedOrderData,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      
      console.log("Order creation response:", response.data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserOrders: async (): Promise<Order[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No token found in localStorage");
        throw new Error("Authentication required");
      }
      console.log("Token from storage:", token.substring(0, 15) + '...');
      
      // Get user data from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error("No user data found in localStorage");
        throw new Error("User data not found");
      }
      
      const user = JSON.parse(userStr);
      console.log("User email from localStorage:", user.email);
      
      // Decode token to check payload
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log("Decoded token userId:", payload.userId);
        console.log("Decoded token role:", payload.role);
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
      }

      console.log(`Requesting orders from: ${API_URL}/orders/my-orders`);
      const response = await axios.get<OrdersResponse>(
        `${API_URL}/orders/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log("Raw response status:", response.status);
      console.log("Raw response data:", response.data);
      
      if (!response.data.success) {
        console.error("API returned error:", response.data.message);
        throw new Error(response.data.message || "Failed to fetch orders");
      }
      
      if (!Array.isArray(response.data.data)) {
        console.error("Invalid orders data format:", response.data.data);
        return [];
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error in getUserOrders:", error);
      // Check for specific axios errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        console.error(`Axios error (${status}):`, data);
        
        // If unauthorized, clear token
        if (status === 401) {
          localStorage.removeItem('token');
        }
      }
      throw handleApiError(error);
    }
  },

  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await axios.get<OrdersResponse>(
        `${API_URL}/orders/admin`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    try {
      const response = await axios.get<OrderResponse>(
        `${API_URL}/orders/${orderId}`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getOrdersByEmail: async (email: string): Promise<Order[]> => {
    try {
      if (!email) {
        console.error("No email provided for getOrdersByEmail");
        return [];
      }
      
      console.log(`Fetching orders for email: ${email}`);
      const response = await axios.get<OrdersResponse>(
        `${API_URL}/orders/by-email?email=${encodeURIComponent(email)}`,
        {
          headers: getAuthHeader(),
        }
      );
      
      console.log("Orders by email response:", response.data);
      return response.data.data || [];
    } catch (error) {
      console.error("Error in getOrdersByEmail:", error);
      // Don't throw error here, just return empty array
      return [];
    }
  },
};

export default ordersApi;
