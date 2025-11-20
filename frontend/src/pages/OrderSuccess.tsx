import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Lock, Search, ServerCrash } from "lucide-react";
import ordersApi from "@/api/orders";
import { Order } from "@/types/order";
import { usePageTitle } from "@/hooks/usePageTitle";

interface ErrorState {
  status: number | null;
  message: string;
}

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const pageTitle = order
    ? "Order Confirmed | Sandy's Market"
    : error
      ? "Order Lookup Error | Sandy's Market"
      : "Order Status | Sandy's Market";
  usePageTitle(pageTitle);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
      setError(null);
    } catch (error: any) {
      console.error("Failed to fetch order:", error);
      
      // Extract status code and message from the error
      const status = error.status || error.response?.status || null;
      const message = error.message || error.response?.data?.message || "An unknown error occurred";
      
      setError({ status, message });
      setOrder(null);
    }
  };

  // Render specific error UI based on status code
  const renderError = () => {
    if (!error) {
      return (
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto p-6">
              <div className="text-center mb-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            </Card>
          </main>
        </div>
      );
    }

    switch (error.status) {
      case 401:
        // Authentication required
        return (
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8">
              <Card className="max-w-2xl mx-auto p-6">
                <div className="text-center">
                  <Lock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-yellow-600 mb-2">Authentication Required</h1>
                  <p className="text-gray-600 mt-2">You need to be logged in to view this order.</p>
                  <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                  <div className="flex gap-2 justify-center mt-6">
                    <Button onClick={() => navigate("/login")}>
                      Login
                    </Button>
                    <Link to="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        );

      case 403:
        // Access denied - order doesn't belong to user or doesn't exist
        return (
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8">
              <Card className="max-w-2xl mx-auto p-6">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                  <p className="text-gray-600 mt-2">You can only access your own orders.</p>
                  <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    You don't have permission to view this order.
                  </p>
                  <div className="flex gap-2 justify-center mt-6">
                    <Link to="/profile">
                      <Button>View My Orders</Button>
                    </Link>
                    <Link to="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        );

      case 404:
        // Order not found
        return (
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8">
              <Card className="max-w-2xl mx-auto p-6">
                <div className="text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-700 mb-2">Order Not Found</h1>
                  <p className="text-gray-600 mt-2">The order you're looking for doesn't exist.</p>
                  <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    The order ID might be incorrect or the order may have been removed.
                  </p>
                  <div className="flex gap-2 justify-center mt-6">
                    <Link to="/profile">
                      <Button>View My Orders</Button>
                    </Link>
                    <Link to="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        );

      case 500:
        // Server error
        return (
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8">
              <Card className="max-w-2xl mx-auto p-6">
                <div className="text-center">
                  <ServerCrash className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-orange-600 mb-2">Server Error</h1>
                  <p className="text-gray-600 mt-2">Something went wrong on our end.</p>
                  <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    Please try again in a few moments. If the problem persists, contact support.
                  </p>
                  <div className="flex gap-2 justify-center mt-6">
                    <Button onClick={() => id && fetchOrder(id)}>
                      Try Again
                    </Button>
                    <Link to="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        );

      default:
        // Unknown error
        return (
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8">
              <Card className="max-w-2xl mx-auto p-6">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-700 mb-2">Error Loading Order</h1>
                  <p className="text-gray-600 mt-2">Unable to load order details.</p>
                  <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                  {error.status && (
                    <p className="text-gray-400 text-xs mt-3">Error code: {error.status}</p>
                  )}
                  <div className="flex gap-2 justify-center mt-6">
                    <Button onClick={() => id && fetchOrder(id)}>
                      Try Again
                    </Button>
                    <Link to="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        );
    }
  };

  if (!order) return renderError();

  // Sharp zigzag divider for a receipt look
  const ZigZagDivider = () => (
    <svg className="w-full h-2 text-gray-300" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="zigzag" x="0" y="0" width="6" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 4 L3 0 L6 4" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zigzag)" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-0 overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 p-4 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h1 className="text-xl font-bold text-green-700">Order Successful!</h1>
            <p className="text-gray-600 text-sm">Thank you for your order</p>
          </div>

          {/* Receipt body */}
          <div className="p-5 font-mono text-sm">
            {/* Store header */}
            <div className="text-center">
              <div className="text-lg font-extrabold tracking-wider">Sandy's Market</div>
              <div className="text-gray-600">1057 Estey Rd, Beaverton, MI 48612</div>
              <div className="text-gray-600">(989) 435-7088</div>
            </div>
            <div className="my-4"><ZigZagDivider /></div>

            {/* Meta */}
            <div className="flex justify-between">
              <div>
                <div className="text-gray-500">ORDER ID</div>
                <div className="font-semibold">{order._id}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500">STATUS</div>
                <div className="font-semibold">{order.status.toUpperCase()}</div>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-gray-600">
              <span>{new Date((order as any).createdAt || Date.now()).toLocaleString()}</span>
              <span>{order.deliveryType === "door-delivery" ? "Delivery" : "Pickup"}</span>
            </div>

            <div className="my-4"><ZigZagDivider /></div>

            {/* Items */}
            <div className="mb-2 font-semibold">Items</div>
            {order.items.map((item, index) => (
              <div key={index} className="py-2">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.size && (
                  <div className="text-xs text-gray-500 mt-0.5">Size: {item.size}</div>
                )}
                {(item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) && (
                  <div className="text-xs text-gray-700 mt-1">
                    Toppings: {item.toppings.join(', ')}
                  </div>
                )}
                <div className="mt-2"><ZigZagDivider /></div>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="my-2"><ZigZagDivider /></div>
              <div className="flex justify-between text-base font-extrabold">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="my-4"><ZigZagDivider /></div>

            {/* Customer */}
            <div>
              <div className="font-semibold mb-1">Customer</div>
              <div className="text-gray-700">{order.customerName}</div>
              <div className="text-gray-700">{order.phone}</div>
              <div className="text-gray-700 mt-1">
                {order.deliveryType === "door-delivery" ? "Delivery Address:" : "Pickup Address:"} {order.deliveryType === "door-delivery" ? order.address : "1057 Estey Rd, Beaverton, MI 48612"}
              </div>
              {order.cookingInstructions && (
                <div className="text-gray-700 mt-2">Notes: {order.cookingInstructions}</div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Link to="/" className="flex-1">
                <Button className="w-full">Return Home</Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
