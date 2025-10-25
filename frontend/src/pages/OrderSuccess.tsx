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
  
      
      // Log toppings information for each item
      if (orderData && orderData.items) {
        orderData.items.forEach((item, index) => {
          console.log(`Item ${index}: ${item.name}`, {
            hasToppings: !!item.toppings,
            toppingsArray: item.toppings,
            toppingsLength: item.toppings ? item.toppings.length : 0,
            toppingsData: item.toppings ? JSON.stringify(item.toppings) : 'null',
          });
        });
      }
      
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
                <div key={index} className="border-b border-gray-100 mb-2 pb-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  
                  {item.size && (
                    <div className="text-xs text-gray-500 ml-4 mt-1">
                      Size: {item.size}
                    </div>
                  )}
                  
                  {/* Show toppings if they exist and are in an array format */}
                  {(item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) && (
                    <div className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-600 ml-2 mt-1">
                      <span className="text-green-600 font-bold">TOPPINGS:</span> {item.toppings.join(', ')}
                    </div>
                  )}
                  
                  {/* Show warning only if it's a topping pizza with no toppings */}
                  {(item.name.toLowerCase().includes('topping') && 
                    (!item.toppings || !Array.isArray(item.toppings) || item.toppings.length === 0)) && (
                    <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-600 ml-2 mt-1">
                      <span className="text-red-600 font-bold">WARNING:</span> Topping pizza with no toppings selected!
                    </div>
                  )}
                </div>
              ))}
              <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Your Details</h3>
              <p className="text-sm text-gray-600">Name: {order.customerName}</p>
              <p className="text-sm text-gray-600">Phone: {order.phone}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  order.deliveryType === "door-delivery"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {order.deliveryType === "door-delivery" ? "Door Delivery" : "Pickup"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {order.deliveryType === "door-delivery" ? "Delivery Address" : "Pickup Address"}: {
                  order.deliveryType === "door-delivery" ? order.address : "1057 Estey Rd, Beaverton, MI 48612"
                }
              </p>
            </div>

            {order.cookingInstructions && (
              <div>
                <h3 className="font-semibold">Cooking Instructions</h3>
                <div className="text-sm bg-orange-50 p-3 rounded border-l-2 border-orange-600">
                  {order.cookingInstructions}
                </div>
              </div>
            )}
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
