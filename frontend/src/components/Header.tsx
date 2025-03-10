import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, User, Shield } from "lucide-react";
import { useForm } from "react-hook-form";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();
  
  const form = useForm();
  const cartItems = form.watch("items") || [];
  const cartTotal = cartItems.reduce(
    (total: number, item: any) => total + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // Check if user is logged in and get role
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
        setIsAdmin(user.role === "admin");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleProfileClick = () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/profile");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-200 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl text-orange-600">
            Sandy's Market
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/order-pizza"
              className="text-sm font-medium hover:text-orange-500 transition-colors"
            >
              Order Pizza
            </Link>
            <Link
              to="/store"
              className="text-sm font-medium hover:text-orange-500 transition-colors"
            >
              Store
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Cart Summary */}
          <div className="hidden md:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">
              ${cartTotal.toFixed(2)}
            </span>
          </div>

          {/* User Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-orange-50"
            onClick={handleProfileClick}
            title={isAdmin ? "Admin Dashboard" : "User Profile"}
          >
            {isAdmin ? (
              <Shield className="h-5 w-5 text-orange-600" />
            ) : (
              <User className="h-5 w-5 text-orange-600" />
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-orange-50"
              >
                <Menu className="h-5 w-5 text-orange-600" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] border-l border-orange-200"
            >
              <nav className="flex flex-col gap-4">
                <Link
                  to="/order-pizza"
                  className="text-lg font-medium hover:text-orange-500 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Order Pizza
                </Link>
                <Link
                  to="/store"
                  className="text-lg font-medium hover:text-orange-500 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Store
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-lg font-medium hover:text-orange-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <div className="pt-4 border-t border-orange-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-orange-600">
                      Cart Total:
                    </span>
                    <span className="text-orange-600">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  {cartItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm flex justify-between py-1"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-orange-600">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
