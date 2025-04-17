import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ordersApi from "@/api/orders";
import { 
  Checkbox,
} from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import React from "react";
import { useInView } from "framer-motion";

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  items: z.array(z.any()),
});

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  toppings?: string[];
}

export default function PizzaOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [showToppingSelector, setShowToppingSelector] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const menu = {
    pizzas: {
      regular: [
        {
          name: "1 Item Pizza",
          prices: { medium: "13.99", large: "16.99" },
          description: "Choose one topping from our selection",
          image: "/images/pizza1.jpg"
        },
        {
          name: "2 Item Pizza",
          prices: { medium: "14.99", large: "17.99" },
          description: "Choose two toppings from our selection",
          image: "/images/pizza2.jpg"
        },
        {
          name: "3 Item Pizza",
          prices: { medium: "15.99", large: "18.99" },
          description: "Choose three toppings from our selection",
          image: "/images/pizza3.jpg"
        },
        {
          name: "Supreme Pizza",
          prices: { medium: "20.99", large: "22.99" },
          description: "Pepperoni, sausage, onions, peppers, olives",
          image: "/images/pizza4.jpg"
        },
      ],
      specialty: [
        {
          name: "Chicken Bacon Ranch",
          price: "22.99",
          description: "Grilled chicken, bacon, and ranch",
          image: "/images/pizza1.jpg"
        },
        {
          name: "BLT Pizza",
          price: "22.99",
          description: "Bacon, lettuce & tomato",
          image: "/images/pizza2.jpg"
        },
        {
          name: "The Big Pig",
          price: "22.99",
          description: "All meat pizza",
          image: "/images/pizza3.jpg"
        },
        {
          name: "Breakfast Pizza",
          price: "22.99",
          description: "Bacon, ham, sausage & eggs",
          image: "/images/pizza4.jpg"
        },
        {
          name: "BBQ Chicken",
          price: "22.99",
          description: "Chicken with BBQ sauce",
          image: "/images/pizza1.jpg"
        },
        {
          name: "Hawaiian",
          price: "22.99",
          description: "Bacon, ham, pineapple",
          image: "/images/pizza2.jpg"
        },
      ],
    },
    sides: [
      {
        name: "Cheesy Bread",
        prices: { medium: "11.99", large: "13.99" },
        description: '14" or 16"',
        image: "/images/pizza1.jpg"
      },
      {
        name: "French Fries",
        price: "3.49",
        image: "/images/frenchfries.jpg"
      },
      {
        name: "Onion Rings",
        price: "4.99",
        image: "/images/onionrings.jpg"
      },
      {
        name: "Mushrooms (12)",
        price: "6.99",
        image: "/images/mushroom.jpg"
      },
      {
        name: "Jalapeno Poppers (6)",
        price: "5.99",
        image: "/images/pizza1.jpg"
      },
      {
        name: "Mozzarella Sticks (5)",
        price: "7.99",
        image: "/images/mozarellasticks.jpg"
      },
      {
        name: "Mini Tacos (12)",
        price: "6.99",
        image: "/images/minitacos.jpg"
      },
      {
        name: "MacNCheese Bites",
        price: "6.99",
        image: "/images/pizza1.jpg"
      },
    ],
    chicken: [
      {
        name: "Chicken Strips (4) w/ff",
        price: "9.49",
        image: "/images/chickenstrips.jpg"
      },
      {
        name: "Original Chicken Drummies (6)",
        price: "7.99",
        image: "/images/pizza1.jpg"
      },
      {
        name: "Original Chicken Drummies (12)",
        price: "11.99",
        image: "/images/pizza2.jpg"
      },
      {
        name: "Flavored Chicken Drummies",
        price: "+1.50",
        description: "Hot, BBQ, Garlic Parmesan, or Teriyaki",
        image: "/images/pizza3.jpg"
      },
    ],
    subs: [
      {
        name: "Ham & Cheese Sub",
        price: "9.99",
        image: "/images/subs.jpg"
      },
      {
        name: "Italian Sub",
        price: "9.99",
        description: "Ham, Salami, Pepperoni & cheese",
        image: "/images/subs2.jpg"
      },
      {
        name: "Turkey & Cheese Sub",
        price: "9.99",
        image: "/images/subs3.jpg"
      },
      {
        name: "Pizza Sub",
        price: "9.99",
        description: "Pepperoni, Ham & Cheese",
        image: "/images/subs4.jpg"
      },
    ],
    deliSalads: [
      {
        name: "Pickle Bologna/Salami & Cheese",
        price: "market",
        image: "/images/delisalads.jpg"
      },
      {
        name: "Macaroni Salad",
        price: "market",
        image: "/images/deli2.jpg"
      },
      {
        name: "Cole Slaw",
        price: "market",
        image: "/images/deli3.jpg"
      },
      {
        name: "Chicken Salad",
        price: "market",
        image: "/images/deli4.jpg"
      },
      {
        name: "Tropical Fruit Salad",
        price: "market",
        image: "/images/deli6.jpg"
      },
      {
        name: "Potato Salad",
        price: "market",
        image: "/images/deli5.jpg"
      },
    ],
    burgers: [
      {
        name: "Cheeseburger",
        price: "5.99",
      },
    ],
    specials: [
      {
        name: "Family Meal Deal",
        price: "29.99",
        description:
          "Large 3 topping pizza & 14in cheesy bread plus a Faygo 2 liter",
      },
      {
        name: "Lunch Special",
        price: "6.49",
        description: "2 slices of pizza and a 32oz fountain pop",
      },
    ],
  };

  const toppings = [
    "Ham",
    "Pepperoni",
    "Bacon",
    "Sausage",
    "Burger",
    "Green Olives",
    "Black Olives",
    "Mild Peppers",
    "Green Peppers",
    "Mushrooms",
    "Onions",
    "Pineapple",
    "Lettuce",
    "Tomato",
    "Grilled Chicken",
    "Jalapeño Peppers",
  ];

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      items: [],
    },
  });

  // Memoize the menu data
  const memoizedMenu = useMemo(() => menu, []);

  const getItemQuantity = useCallback((itemName: string) => {
    const items = form.getValues("items") || [];
    const item = items.find((i: any) => i.name === itemName);
    return item?.quantity || 0;
  }, [form]);

  const handleQuantityChange = useCallback((item: any, delta: number, size?: string) => {
    const itemName = size ? `${item.name} (${size})` : item.name;
    const price = size
      ? Number(item.prices[size.toLowerCase()])
      : Number(item.price);
    const currentItems = form.getValues("items") || [];
    
    // Create a unique ID for this pizza (for tracking toppings)
    const itemKey = `${item.name}-${size || "default"}`;
    
    // For regular pizzas, check if toppings are needed when adding to cart
    if (delta > 0 && item.name.includes("Item Pizza")) {
      // Determine how many toppings are required for this pizza
      let requiredToppings = 0;
      if (item.name.includes("1 Item")) {
        requiredToppings = 1;
      } else if (item.name.includes("2 Item")) {
        requiredToppings = 2;
      } else if (item.name.includes("3 Item")) {
        requiredToppings = 3;
      }
      
      // Check if enough toppings are selected
      const currentToppings = selectedToppings[itemKey] || [];
      if (currentToppings.length < requiredToppings) {
        setShowToppingSelector(itemKey);
        toast({
          title: "Select Toppings",
          description: `Please select ${requiredToppings} toppings for your pizza.`,
        });
        return;
      }
    }

    const existingItemIndex = currentItems.findIndex(
      (i: any) => i.name === itemName
    );

    if (existingItemIndex >= 0) {
      const newQuantity = Math.max(
        0,
        currentItems[existingItemIndex].quantity + delta
      );
      if (newQuantity === 0) {
        currentItems.splice(existingItemIndex, 1);
      } else {
        currentItems[existingItemIndex].quantity = newQuantity;
        
        // Include selected toppings with the item
        if (item.name.includes("Item Pizza") && selectedToppings[itemKey]) {
          currentItems[existingItemIndex].toppings = selectedToppings[itemKey];
        }
      }
    } else if (delta > 0) {
      const newItem: CartItem = { 
        name: itemName, 
        quantity: 1, 
        price 
      };
      
      // Add selected toppings to the cart item
      if (item.name.includes("Item Pizza") && selectedToppings[itemKey]) {
        newItem.toppings = selectedToppings[itemKey];
      }
      
      currentItems.push(newItem);
    }

    form.setValue("items", currentItems);

    if (delta > 0) {
      const toppingsMessage = selectedToppings[itemKey]?.length 
        ? ` with toppings: ${selectedToppings[itemKey].join(", ")}` 
        : '';
        
      toast({
        title: "Added to cart",
        description: `${itemName} added to your order${toppingsMessage}`,
        action: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />
          </div>
        ),
        className: "md:left-4 md:right-auto",
      });
    }
  }, [form, selectedToppings, toast]);

  // Memoize the render functions with proper dependencies
  const memoizedRenderQuantityControls = useCallback((item: any, size?: string) => (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(item, -1, size)}
        aria-label="Decrease quantity"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center">
        {getItemQuantity(size ? `${item.name} (${size})` : item.name)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(item, 1, size)}
        aria-label="Increase quantity"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  ), [handleQuantityChange, getItemQuantity]);

  // Update the MenuSection component to use memoized props with proper dependencies
  const MenuSection = React.memo(({ category, title }: { category: string; title: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "100px" });

    return (
      <div ref={ref}>
        {isInView ? renderMenuSection(category, title) : (
          <div className="h-[200px] flex items-center justify-center">
            <LoadingSpinner size={24} />
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => prevProps.category === nextProps.category);

  // Update the cart section to use memoized items with proper comparison function
  const CartSummary = React.memo(() => {
    return (
      <Card className="p-4 shadow-lg">
        <h3 className="font-bold mb-2">Cart</h3>
        {cartItems.length > 0 ? (
          <>
            {cartItems.map((item: any, index: number) => (
              <div key={index} className="text-sm">
                {item.quantity}x {item.name} - $
                {(item.price * item.quantity).toFixed(2)}
              </div>
            ))}
            <div className="mt-2 font-bold">
              Total: $
              {cartItems
                .reduce(
                  (acc: number, item: any) =>
                    acc + item.price * item.quantity,
                  0
                )
                .toFixed(2)}
            </div>
            <Button 
              className="mt-2 w-full" 
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size={20} className="mr-2" />
              ) : null}
              {isSubmitting ? "Processing..." : "Order"}
            </Button>
          </>
        ) : (
          <p className="text-gray-500">Cart is empty</p>
        )}
      </Card>
    );
  }, (prevProps, nextProps) => true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "items") {
        setCartItems(value.items || []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleToppingSelection = (pizzaName: string, size: string, topping: string) => {
    const itemKey = `${pizzaName}-${size}`;
    
    setSelectedToppings(prev => {
      const currentToppings = prev[itemKey] || [];
      const isSelected = currentToppings.includes(topping);
      
      // If topping is already selected, remove it
      if (isSelected) {
        return {
          ...prev,
          [itemKey]: currentToppings.filter(t => t !== topping)
        };
      }
      
      // Check for max toppings based on pizza name
      let maxToppings = 3; // Default max
      if (pizzaName.includes("1 Item")) {
        maxToppings = 1;
      } else if (pizzaName.includes("2 Item")) {
        maxToppings = 2;
      } else if (pizzaName.includes("3 Item")) {
        maxToppings = 3;
      }
      
      // Check if we've reached the limit
      if (currentToppings.length >= maxToppings) {
        toast({
          title: "Maximum Toppings Reached",
          description: `You can only select ${maxToppings} toppings for this pizza.`,
          variant: "destructive"
        });
        return prev;
      }
      
      // Add the topping
      return {
        ...prev,
        [itemKey]: [...currentToppings, topping]
      };
    });
  };

  const renderQuantityControls = (item: any, size?: string) => (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(item, -1, size)}
        aria-label="Decrease quantity"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center">
        {getItemQuantity(size ? `${item.name} (${size})` : item.name)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(item, 1, size)}
        aria-label="Increase quantity"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderToppingsSelector = (item: any, size: string) => {
    if (!item.name.includes("Item Pizza")) return null;
    
    const itemKey = `${item.name}-${size}`;
    const currentToppings = selectedToppings[itemKey] || [];
    const isVisible = showToppingSelector === itemKey;
    
    // Determine max toppings
    let maxToppings = 3;
    if (item.name.includes("1 Item")) {
      maxToppings = 1;
    } else if (item.name.includes("2 Item")) {
      maxToppings = 2;
    } else if (item.name.includes("3 Item")) {
      maxToppings = 3;
    }
    
    return (
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowToppingSelector(isVisible ? null : itemKey)}
          className="w-full text-sm"
        >
          {isVisible ? "Hide Toppings" : currentToppings.length > 0 
            ? `Selected Toppings (${currentToppings.length}/${maxToppings})` 
            : `Select Toppings (0/${maxToppings})`
          }
        </Button>
        
        {isVisible && (
          <Card className="mt-2 p-3">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-semibold">Select Toppings</h5>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowToppingSelector(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {currentToppings.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {currentToppings.map(topping => (
                  <div key={topping} className="bg-primary/10 text-xs rounded px-2 py-1 flex items-center gap-1">
                    {topping}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToppingSelection(item.name, size, topping)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toppings.map(topping => (
                <div key={topping} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    id={`${itemKey}-${topping}`}
                    checked={currentToppings.includes(topping)}
                    onChange={() => handleToppingSelection(item.name, size, topping)}
                    className="rounded text-primary h-4 w-4"
                  />
                  <label htmlFor={`${itemKey}-${topping}`} className="text-sm flex-1">
                    {topping}
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderMenuSection = (category: string, title: string) => {
    const items = menu[category as keyof typeof menu];

    if (category === "pizzas") {
      const pizzaItems = menu[category] as {
        regular: Array<{
          name: string;
          prices: { medium: string; large: string };
          description: string;
          image: string;
        }>;
        specialty: Array<{
          name: string;
          price: string;
          description: string;
          image: string;
        }>;
      };

      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Regular Pizzas</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {pizzaItems.regular.map((item: any) => (
                <Card key={item.name} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="mt-2">
                        <p>Medium (16"): ${item.prices.medium}</p>
                        <p>Large (22"): ${item.prices.large}</p>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <Label>Medium</Label>
                        {renderQuantityControls(item, "medium")}
                        {renderToppingsSelector(item, "medium")}
                        <Label className="mt-2">Large</Label>
                        {renderQuantityControls(item, "large")}
                        {renderToppingsSelector(item, "large")}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Specialty Pizzas</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {pizzaItems.specialty.map((item: any) => (
                <Card key={item.name} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="mt-2">${item.price}</p>
                      {renderQuantityControls(item)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Available Toppings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {toppings.map((topping) => (
                <div key={topping} className="text-gray-700">
                  • {topping}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.isArray(items) &&
          items.map((item: any) => (
            <Card key={item.name} className="p-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="mt-2">
                    {item.price === "market"
                      ? "Market Price"
                      : item.prices
                      ? `Medium: $${item.prices.medium}, Large: $${item.prices.large}`
                      : `$${item.price}`}
                  </p>
                  {item.price !== "market" && renderQuantityControls(item)}
                </div>
              </div>
            </Card>
          ))}
      </div>
    );
  };

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      const formData = form.getValues();
      const items = formData.items || [];

      if (!formData.customerName || !formData.phone || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (items.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your order",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      const orderData = {
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        address: "Pickup",
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        totalAmount: Number(totalAmount),
      };

      const response = await ordersApi.createOrder(orderData);

      if (response) {
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been received and is being processed.",
        });

        form.reset({
          customerName: "",
          phone: "",
          email: "",
          items: [],
        });

        navigate(`/orders/${response._id || response.id}`);
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sandy's Market Menu</h1>
          <div className="text-right">
            <p>1057 Estey Rd</p>
            <p>Beaverton, MI 48612</p>
            <p>Phone: (989)435-9688</p>
          </div>
        </div>

        <Card className="p-4 mb-8 bg-primary/5">
          <h2 className="text-xl font-bold mb-2">Hours</h2>
          <p>Sun to Thurs: 10am-9pm</p>
          <p>Fri & Sat: 10am–10pm</p>
        </Card>

        <Form {...form}>
          <form className="mb-8 space-y-4">
            <Card className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </form>
        </Form>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Pizza Menu</h2>
            <MenuSection category="pizzas" title="Pizza Menu" />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Daily Specials</h2>
            <MenuSection category="specials" title="Daily Specials" />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Subs - $9.99 each</h2>
            <MenuSection category="subs" title="Subs" />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Chicken</h2>
            <MenuSection category="chicken" title="Chicken" />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Sides & Baskets</h2>
            <MenuSection category="sides" title="Sides & Baskets" />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Deli Salads</h2>
            <MenuSection category="deliSalads" title="Deli Salads" />
          </section>
        </div>

        <div className="fixed bottom-4 right-4 flex gap-2">
          <CartSummary />
        </div>
      </main>
      <Footer />
    </div>
  );
}
