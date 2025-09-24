import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, User, Shield } from "lucide-react";

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
  const [cartItems, setCartItems] = useState<any[]>([]);
  const navigate = useNavigate();
  
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
    
    // Load cart items from localStorage
    const loadCartFromStorage = () => {
      const cartStr = localStorage.getItem("items");
      if (cartStr) {
        try {
          const items = JSON.parse(cartStr);
          setCartItems(items);
        } catch (error) {
          console.error("Error parsing cart data:", error);
        }
      } else {
        setCartItems([]);
      }
    };
    
    loadCartFromStorage();
    
    // Listen for storage changes to sync cart across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "items") {
        loadCartFromStorage();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom cart update events
    const handleCartUpdate = () => {
      loadCartFromStorage();
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const handleProfileClick = () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/profile");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-200 bg-white/95 backdrop-blur-sm shadow-lg">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/images/favi.png" 
              alt="Sandy's Market Logo" 
              className="h-10 w-auto rounded-full"
            />
            <h1 className="text-lg font-bold text-orange-600">Sandy's Market</h1>
          </Link>

          <nav className="hidden md:flex items-center">
            <Link
              to="/order-pizza"
              className="text-sm font-medium hover:text-orange-500 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-orange-50 hover:shadow-sm border border-transparent hover:border-orange-200"
            >
              🍕 Order Food
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Cart Summary */}
          <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-2 rounded-full relative min-w-[120px] justify-center border border-orange-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
            <ShoppingCart className="h-4 w-4 text-orange-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-orange-700">
              ${cartTotal.toFixed(2)}
            </span>
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                {cartItems.length}
              </span>
            )}
          </div>

          {/* User Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-orange-50 transition-all duration-200 w-10 h-10 rounded-full border border-transparent hover:border-orange-200 hover:shadow-sm group"
            onClick={handleProfileClick}
            title={isAdmin ? "Admin Dashboard" : "User Profile"}
          >
            {isAdmin ? (
              <Shield className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            ) : (
              <User className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            )}
          </Button>

          {/* Mobile Cart Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                className="hover:bg-orange-100 flex items-center gap-2 px-3 py-2 h-10 relative rounded-full bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">
                  ${cartTotal.toFixed(2)}
                </span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-md animate-pulse">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[350px] sm:w-[400px] border-l border-orange-200 bg-gradient-to-b from-white to-orange-50/30"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 pb-4 border-b border-orange-200">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                </div>
                
                <nav className="flex flex-col gap-3 pt-4">
                  <Link
                    to="/order-pizza"
                    className="flex items-center gap-3 text-lg font-medium hover:text-orange-500 transition-colors p-3 rounded-lg hover:bg-orange-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-orange-600">🍕</span>
                    Order Food
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 text-lg font-medium hover:text-orange-500 transition-colors p-3 rounded-lg hover:bg-orange-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5 text-orange-600" />
                      Admin Dashboard
                    </Link>
                  )}
                </nav>
                
                <div className="flex-1 mt-6">
                  <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">Cart Summary</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Your cart is empty</p>
                        <p className="text-xs mt-1">Add some delicious items!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cartItems.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-3 px-3 bg-orange-50/50 rounded-lg border border-orange-100"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 text-sm">
                                {item.quantity}x {item.name}
                              </div>
                              {item.toppings && item.toppings.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  + {item.toppings.join(', ')}
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-orange-600 ml-2">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-orange-200 pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-gray-800">
                          Total:
                        </span>
                        <span className="text-xl font-bold text-orange-600">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      
                      {cartItems.length > 0 && (
                        <Link 
                          to="/order-pizza" 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Go to Cart
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
