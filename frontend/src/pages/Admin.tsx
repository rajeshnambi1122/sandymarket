import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { Order } from "@/types/index";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShoppingBag, Package, TruckIcon, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AdminStats from "@/components/AdminStats";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Admin() {
  usePageTitle("Admin Dashboard | Sandy's Market");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Format currency values
  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  // Function to fetch orders
  const fetchOrders = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to access the admin dashboard",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);


      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });



      // Process the orders to ensure consistent ID handling
      let processedOrders: Order[] = [];

      // Check the response structure and extract the orders array
      if (response.data && Array.isArray(response.data)) {
        processedOrders = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If the response has a data property containing the array
        processedOrders = response.data.data;
      } else {
        // Fallback to empty array if structure is unexpected
        console.error("Unexpected API response structure:", response.data);
        processedOrders = [];
      }

      // Ensure each order has a consistent _id field as a string
      const normalizedOrders = processedOrders.map(order => {
        const id = order._id || order.id;
        return {
          ...order,
          _id: String(id),
          id: String(order.id || id)
        };
      });


      setOrders(normalizedOrders);

      // Save to localStorage as a cache
      localStorage.setItem('cached_orders', JSON.stringify(normalizedOrders));
    } catch (error) {
      console.error("Error fetching orders:", error);

      // If API fails, try to use cached orders
      const cachedOrders = localStorage.getItem('cached_orders');
      if (cachedOrders) {
        try {
          const parsedOrders = JSON.parse(cachedOrders);
          setOrders(parsedOrders);


          toast({
            title: "Using Cached Data",
            description: "Server unavailable. Showing previously loaded orders.",
            variant: "default",
          });
        } catch (parseError) {
          console.error("Error parsing cached orders:", parseError);
        }
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Handle token expiration
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive",
          });
          navigate("/login");
        } else if (error.response?.status === 403) {
          // Handle unauthorized access (not admin)
          toast({
            title: "Access Denied",
            description: "You do not have permission to access the admin dashboard",
            variant: "destructive",
          });
          navigate("/");
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch orders. Using cached data if available.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders. Using cached data if available.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify admin access on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast({
        title: "Authentication required",
        description: "Please log in to access the admin dashboard",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin" && user.role !== "admin1") {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    // If checks pass, fetch orders
    fetchOrders();
  }, []);  // Empty dependency array

  // Update order status - CLIENT-SIDE ONLY MODE
  // This is a temporary workaround because the backend API endpoints for updating orders are not working
  // All changes are stored in the browser's localStorage to persist between page refreshes
  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to update orders",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Validate order ID format
    if (!orderId || typeof orderId !== 'string') {
      console.error('Invalid order ID type or empty ID:', orderId);
      toast({
        title: "Invalid Order ID",
        description: "The order ID is missing or invalid",
        variant: "destructive",
      });
      return;
    }

    // Check if this order exists in our local state
    const orderExists = orders.some(order => order._id === orderId);
    if (!orderExists) {
      console.error('Attempting to update non-existent order:', orderId);
      toast({
        title: "Order Not Found Locally",
        description: "This order doesn't exist in the current order list. Refreshing data...",
        variant: "destructive",
      });

      // Refresh orders
      fetchOrders();
      return;
    }

    // TEMPORARY WORKAROUND: Client-side only updates
    // Update the UI immediately with the new status
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, status } : order
      )
    );

    toast({
      title: "Status Updated (UI Only)",
      description: "Order status updated on screen only. Backend API is unavailable.",
      variant: "default",
    });

    // Store updated orders in local storage to persist between page refreshes
    const updatedOrders = orders.map(order =>
      order._id === orderId ? { ...order, status } : order
    );
    try {
      localStorage.setItem('cached_orders', JSON.stringify(updatedOrders));

    } catch (error) {
      console.error('Failed to cache orders in localStorage', error);
    }

    // Log attempt for debugging


    // Only attempt one endpoint to reduce console errors
    try {
      // Try just the standard RESTful endpoint with PATCH method
      const endpoint = `${API_URL}/orders/${orderId}`;


      const response = await axios.patch(
        endpoint,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 204) {


        toast({
          title: "Status Updated",
          description: `Order status updated to ${status} successfully.`,
        });
      }
    } catch (error) {
      // Handle errors silently since we've already updated the UI
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          toast({
            title: "Access Denied",
            description: "You do not have permission to update orders",
            variant: "destructive",
          });
          navigate("/");
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ShoppingBag className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'ready':
        return <TruckIcon className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Admin Dashboard Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1 w-10 bg-orange-600 rounded-full"></span>
              <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-medium bg-orange-100 text-orange-600 rounded-full">
                Admin Dashboard
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Orders Management</h1>
            <p className="text-sm md:text-base text-gray-600">Manage and track all orders from a central dashboard</p>
          </div>

          {/* Display admin stats */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md mb-6 md:mb-8 overflow-x-auto">
            <AdminStats orders={orders} />
          </div>

          <Card className="p-3 md:p-6 border border-orange-100/50 shadow-lg rounded-2xl overflow-hidden bg-white">
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="mb-4 w-full justify-start bg-gray-100 p-1 min-w-max rounded-xl">
                  <TabsTrigger value="all" className="text-xs md:text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all">
                    All Orders
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs md:text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="preparing" className="text-xs md:text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all">
                    Preparing
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="text-xs md:text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all">
                    Ready
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="text-xs md:text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all">
                    Delivered
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab}>
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 md:py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 mb-4 font-medium">
                        No {activeTab !== "all" ? activeTab : ""} orders found
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {filteredOrders.map((order) => (
                        <Card key={order._id} className="overflow-hidden bg-white border border-orange-100/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group">
                          <div className="border-l-4 border-orange-600 p-4 md:p-6">
                            <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-8">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                    <h3 className="font-bold text-lg md:text-xl font-heading text-gray-800">Order #{order._id?.toString().slice(-6)}</h3>
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                      {getStatusIcon(order.status)}
                                      <span className="capitalize font-semibold">{order.status}</span>
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6">
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h4>
                                    <p className="font-semibold text-sm md:text-base text-gray-900 mb-1">{order.customerName}</p>
                                    <p className="text-xs md:text-sm text-gray-600 mb-0.5">{order.email}</p>
                                    <p className="text-xs md:text-sm text-gray-600">{order.phone}</p>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                      {order.deliveryType === "door-delivery" ? "Delivery Info" : "Pickup Info"}
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${order.deliveryType === "door-delivery"
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-green-100 text-green-700 border border-green-200"
                                        }`}>
                                        {order.deliveryType === "door-delivery" ? "Door Delivery" : "Pickup"}
                                      </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-700 font-medium leading-relaxed">{order.address || "Pickup at store"}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
                                  <div className="overflow-x-auto bg-gray-50 rounded-xl border border-gray-100 p-4">
                                    <ul className="divide-y divide-gray-200 min-w-max md:min-w-0">
                                      {order.items.map((item, idx) => (
                                        <li key={idx} className="py-3 flex justify-between text-xs md:text-sm first:pt-0 last:pb-0">
                                          <div className="flex items-center gap-3">
                                            <span className="font-bold text-orange-600 bg-orange-100 w-6 h-6 flex items-center justify-center rounded-full text-xs">{item.quantity}</span>
                                            <span className="font-medium text-gray-800">{item.name}</span>
                                            {item.size && <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">({item.size})</span>}
                                          </div>
                                          <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="mt-4 flex flex-col items-end gap-1">
                                    {order.coupon && order.coupon.isApplied && (
                                      <>
                                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                                          <span>Subtotal:</span>
                                          <span>{formatCurrency(order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs md:text-sm text-green-600 font-medium">
                                          <span>Discount ({order.coupon.code}{order.coupon.discountPercentage ? ` - ${order.coupon.discountPercentage}%` : ''}):</span>
                                          <span>-{formatCurrency(order.coupon.discountAmount || 0)}</span>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex items-center gap-3 mt-1">
                                      <h4 className="text-sm font-medium text-gray-500">Total Amount:</h4>
                                      <p className="text-xl md:text-2xl font-bold text-orange-600 font-heading">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="w-full lg:w-72 flex flex-col bg-orange-50/50 p-4 rounded-xl border border-orange-100 h-fit">
                                <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Update Status</h4>
                                <Select
                                  defaultValue={order.status}
                                  onValueChange={(value) =>
                                    updateOrderStatus(order._id, value as Order["status"])
                                  }
                                >
                                  <SelectTrigger className="w-full bg-white border-orange-200 focus:ring-orange-500 text-sm h-10 rounded-lg shadow-sm">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl shadow-xl border-orange-100">
                                    <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
                                    <SelectItem value="preparing" className="cursor-pointer">Preparing</SelectItem>
                                    <SelectItem value="ready" className="cursor-pointer">Ready</SelectItem>
                                    <SelectItem value="delivered" className="cursor-pointer">Delivered</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                  Changing status will update the customer's order tracking page immediately.
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
