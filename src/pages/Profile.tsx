import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";
import type { PizzaOrder } from "@/types/order";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<PizzaOrder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserData(token);
    fetchUserOrders(token);
  }, [navigate]);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUserOrders = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

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

        <h2 className="text-xl font-bold mb-4">Order History</h2>
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">
                    Order Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
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
                <div>
                  <span className="px-2 py-1 text-sm rounded bg-primary/10 text-primary">
                    {order.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
