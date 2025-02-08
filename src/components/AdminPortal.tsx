import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PizzaOrder } from "@/types/order";
import { API_URL } from "@/config/api";

export function AdminPortal() {
  const [orders, setOrders] = useState<PizzaOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: PizzaOrder["status"]
  ) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders after update
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{order.customerName}</h3>
                <p className="text-sm text-gray-600">{order.phone}</p>
                <p className="text-sm text-gray-600">{order.address}</p>
                <div className="mt-2">
                  {order.items.map((item, index) => (
                    <p key={index} className="text-sm">
                      {item.quantity}x {item.name} - $
                      {item.price * item.quantity}
                    </p>
                  ))}
                </div>
                <p className="font-bold mt-2">Total: ${order.totalAmount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Status: {order.status}</p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    disabled={order.status !== "pending"}
                  >
                    Start Preparing
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    disabled={order.status !== "preparing"}
                  >
                    Mark Ready
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    disabled={order.status !== "ready"}
                  >
                    Mark Delivered
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
