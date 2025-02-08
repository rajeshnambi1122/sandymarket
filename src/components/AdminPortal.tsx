import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import ordersApi from "@/api/orders";
import { Order } from "@/types/order";

export function AdminPortal() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await ordersApi.getOrders();
      console.log("Fetched orders:", fetchedOrders); // Debug log
      if (Array.isArray(fetchedOrders)) {
        setOrders(
          fetchedOrders.map((order) => ({
            ...order,
            id: order._id || order.id, // Handle both _id and id
          }))
        );
      } else {
        console.error("Invalid orders data:", fetchedOrders);
        setOrders([]);
        toast({
          title: "Error",
          description: "Invalid orders data received",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
      setOrders([]);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      console.log("Updating order:", { orderId, newStatus }); // Debug log

      if (!orderId) {
        console.error("Missing order ID:", {
          order: orders.find((o) => o.id === orderId),
        });
        throw new Error("Order ID is required");
      }

      const updatedOrder = await ordersApi.updateOrderStatus(
        orderId,
        newStatus
      );
      console.log("Updated order:", updatedOrder); // Debug log

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>
      <div className="grid gap-4">
        {orders.length > 0 ? (
          orders.map((order) => {
            console.log("Rendering order:", order); // Debug log
            return (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{order.customerName}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "pending"
                            ? "bg-orange-100 text-orange-800"
                            : order.status === "preparing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "ready"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.phone}</p>
                    <p className="text-sm text-gray-600">{order.address}</p>
                    <div className="mt-2 space-y-1">
                      {order.items.map((item, index) => (
                        <p key={index} className="text-sm">
                          {item.quantity}x {item.name} - $
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      ))}
                    </div>
                    <p className="font-bold mt-2">
                      Total: ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ordered: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      disabled={order.status !== "pending"}
                    >
                      Start Preparing
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      disabled={order.status !== "preparing"}
                    >
                      Mark Ready
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      disabled={order.status !== "ready"}
                    >
                      Mark Delivered
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">No orders found</p>
        )}
      </div>
    </div>
  );
}
