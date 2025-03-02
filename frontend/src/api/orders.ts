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
      const response = await axios.post<OrderResponse>(
        `${API_URL}/orders`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserOrders: async (): Promise<Order[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log("Token from storage:", token);
      
      // Decode token to see the payload
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log("Decoded token payload:", payload);
      }

      const response = await axios.get<OrdersResponse>(
        `${API_URL}/orders/my-orders`,
        {
          headers: getAuthHeader(),
        }
      );
      console.log("Raw response from server:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error in getUserOrders:", error);
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
};

export default ordersApi;
