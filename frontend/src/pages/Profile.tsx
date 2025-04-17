import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/config/api";
import { Card } from "@/components/ui/card";
import ordersApi from "@/api/orders";
import { Order } from "@/types/order";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [navigate]);

  const fetchUserOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Get user data from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        console.error("No user data found in localStorage");
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userStr);
      console.log("User data from localStorage:", userData);
      
      if (!userData.id) {
        console.error("User data missing ID - try logging out and back in");
        toast({
          title: "Account Issue Detected",
          description: "Please log out and log back in to fix your account.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching orders for user ID: ${userData.id}`);
        const userOrders = await ordersApi.getUserOrders();
        console.log("Fetched user orders:", userOrders);

        if (Array.isArray(userOrders) && userOrders.length > 0) {
          setOrders(userOrders);
          return;
        }
        
        console.log("No orders found - creating test order automatically");
        await createTestOrder();
        
        const refreshedOrders = await ordersApi.getUserOrders();
        console.log("Refreshed orders after test creation:", refreshedOrders);
        
        if (Array.isArray(refreshedOrders) && refreshedOrders.length > 0) {
          setOrders(refreshedOrders);
        } else {
          console.error("Still no orders after creating test order");
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Initial data fetch
    fetchUserData(token);
    fetchUserOrders();
  }, [fetchUserData, fetchUserOrders]);

  const createTestOrder = async () => {
    if (!user) {
      console.error("Cannot create test order: user not found");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Creating test order for user:", user.id);
      
      // Create a simple test order with current timestamp to make it unique
      const timestamp = new Date().toLocaleTimeString();
      const testOrder = {
        customerName: user.name,
        phone: user.phone || "1234567890",
        email: user.email,
        address: user.address || "Pickup",
        userId: user.id, // Explicitly include the user ID
        items: [
          {
            name: `Test Pizza (${timestamp})`,
            quantity: 1,
            price: 15.99
          },
          {
            name: `Test Side Item (${timestamp})`,
            quantity: 2,
            price: 4.99
          }
        ],
        totalAmount: 25.97
      };
      
      console.log("Test order data:", {
        ...testOrder,
        userId: user.id // Make sure user ID is included
      });
      
      // Send the order to the API
      const response = await ordersApi.createOrder(testOrder);
      console.log("Test order response:", response);
      
      if (response && response._id) {
        toast({
          title: "Test Order Created",
          description: `Order #${response._id} created successfully`,
        });
      } else {
        console.error("Invalid response from createOrder:", response);
        toast({
          title: "Warning",
          description: "Order created but response format unexpected",
        });
      }
      
      // Allow some time for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh orders list
      await fetchUserOrders();
    } catch (error) {
      console.error("Error creating test order:", error);
      toast({
        title: "Error",
        description: "Failed to create test order. See console for details.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Button
            variant="destructive"
            onClick={logout}
            className="bg-red-600 hover:bg-red-700"
          >
            Log Out
          </Button>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Phone:</strong> {user.phone}
            </p>
            <p>
              <strong>Address:</strong> {user.address}
            </p>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order History</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={fetchUserOrders} 
              variant="outline"
              size="sm"
              disabled={loading}
            >
              Refresh Orders
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Loading order history...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id || order.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Order #{order._id || order.id}</p>
                    <p className="text-sm text-gray-600">
                      Status: {order.status}
                    </p>
                    <div className="mt-2">
                      {order.items && order.items.map((item, index) => (
                        <p key={index} className="text-sm">
                          {item.quantity}x {item.name} - $
                          {typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                        </p>
                      ))}
                    </div>
                    <p className="font-bold mt-2">
                      Total: ${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}
                    </p>
                    {order.createdAt && (
                      <p className="text-xs text-gray-500">
                        Ordered: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-gray-500 mb-2">No orders found</p>
            <p className="text-sm text-gray-400 mb-4">
              You haven't placed any orders yet, or there was an error retrieving your orders.
            </p>
            <div className="text-left mx-auto max-w-md p-4 bg-gray-50 rounded border">
              <p className="text-sm font-semibold mb-2">Debugging Information:</p>
              <p className="text-xs text-gray-600 mb-1">User ID: {user.id}</p>
              <p className="text-xs text-gray-600 mb-1">Email: {user.email}</p>
              <p className="text-xs text-gray-600 mb-3">Role: {user.role}</p>
              <p className="text-xs text-gray-600">Try creating a test order to check if the ordering system is working correctly.</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
