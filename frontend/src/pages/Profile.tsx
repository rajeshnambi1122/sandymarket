import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/config/api";
import { Card } from "@/components/ui/card";
import ordersApi from "@/api/orders";
import { Order } from "@/types/index";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Profile() {
  usePageTitle("My Profile | Sandy's Market");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      } else {
        setError("Failed to load user data");
      }
    } catch (error) {
      setError("Error loading user data");
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

      const userOrders = await ordersApi.getUserOrders();
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserData(token);
    fetchUserOrders();
  }, [fetchUserData, fetchUserOrders, navigate]);


  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                const token = localStorage.getItem("token");
                if (token) {
                  fetchUserData(token);
                  fetchUserOrders();
                }
              }}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size={32} className="mb-4" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-heading">My Profile</h1>
          <Button
            variant="destructive"
            onClick={logout}
            className="bg-red-600 hover:bg-red-700"
          >
            Log Out
          </Button>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">Personal Information</h2>
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

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-xl font-bold">Order History</h2>
          <Button
            onClick={fetchUserOrders}
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size={32} className="mb-4" />
            <p className="text-gray-500">Loading order history...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id || order.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-heading font-semibold">Order #{order._id || order.id}</p>
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
                    {order.coupon && order.coupon.isApplied && (
                      <p className="text-sm text-green-600 mt-1">
                        Discount ({order.coupon.code}{order.coupon.discountPercentage ? ` - ${order.coupon.discountPercentage}%` : ''}): -${typeof order.coupon.discountAmount === 'number' ? order.coupon.discountAmount.toFixed(2) : order.coupon.discountAmount}
                      </p>
                    )}
                    <p className="font-bold mt-1">
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
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <div className="text-6xl mb-4">🍕</div>
            <p className="text-gray-600 text-lg font-medium mb-2">No orders yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Ready to order some delicious food? Start browsing our menu!
            </p>
            <Button
              onClick={() => navigate('/order')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Browse Menu
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
