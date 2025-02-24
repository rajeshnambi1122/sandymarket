import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ordersApi from "@/api/orders";
import { Order } from "@/types/order";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const orderData = await ordersApi.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    }
  };

  if (!order) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700">Order Successful!</h1>
            <p className="text-gray-600">Thank you for your order</p>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Order Details</h2>
              <p className="text-sm text-gray-600">Order ID: {order._id}</p>
              <p className="text-sm text-gray-600">Status: {order.status.toUpperCase()}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Customer Information</h3>
              <p className="text-sm text-gray-600">Name: {order.customerName}</p>
              <p className="text-sm text-gray-600">Phone: {order.phone}</p>
              <p className="text-sm text-gray-600">Pickup Address: Sandy's Market</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
