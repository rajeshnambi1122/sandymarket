import { useState, useEffect } from "react";
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
import { MinusCircle, PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ordersApi from "@/api/orders";

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(1, "Address is required"),
  items: z.array(z.any()),
});

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export default function PizzaOrder() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const menu = {
    pizzas: {
      regular: [
        {
          name: "1 Item Pizza",
          prices: { medium: "13.99", large: "16.99" },
          description: "Choose one topping from our selection",
        },
        {
          name: "2 Item Pizza",
          prices: { medium: "14.99", large: "17.99" },
          description: "Choose two toppings from our selection",
        },
        {
          name: "3 Item Pizza",
          prices: { medium: "15.99", large: "18.99" },
          description: "Choose three toppings from our selection",
        },
        {
          name: "Supreme Pizza",
          prices: { medium: "20.99", large: "22.99" },
          description: "Pepperoni, sausage, onions, peppers, olives",
        },
      ],
      specialty: [
        {
          name: "Chicken Bacon Ranch",
          price: "22.99",
          description: "Grilled chicken, bacon, and ranch",
        },
        {
          name: "BLT Pizza",
          price: "22.99",
          description: "Bacon, lettuce & tomato",
        },
        {
          name: "The Big Pig",
          price: "22.99",
          description: "All meat pizza",
        },
        {
          name: "Breakfast Pizza",
          price: "22.99",
          description: "Bacon, ham, sausage & eggs",
        },
        {
          name: "BBQ Chicken",
          price: "22.99",
          description: "Chicken with BBQ sauce",
        },
        {
          name: "Hawaiian",
          price: "22.99",
          description: "Bacon, ham, pineapple",
        },
      ],
    },
    sides: [
      {
        name: "Cheesy Bread",
        prices: { medium: "11.99", large: "13.99" },
        description: '14" or 16"',
      },
      {
        name: "French Fries",
        price: "3.49",
      },
      {
        name: "Onion Rings",
        price: "4.99",
      },
      {
        name: "Mushrooms (12)",
        price: "6.99",
      },
      {
        name: "Jalapeno Poppers (6)",
        price: "5.99",
      },
      {
        name: "Mozzarella Sticks (5)",
        price: "7.99",
      },
      {
        name: "Mini Tacos (12)",
        price: "6.99",
      },
      {
        name: "MacNCheese Bites",
        price: "6.99",
      },
    ],
    chicken: [
      {
        name: "Chicken Strips (4) w/ff",
        price: "9.49",
      },
      {
        name: "Original Chicken Drummies (6)",
        price: "7.99",
      },
      {
        name: "Original Chicken Drummies (12)",
        price: "11.99",
      },
      {
        name: "Flavored Chicken Drummies",
        price: "+1.50",
        description: "Hot, BBQ, Garlic Parmesan, or Teriyaki",
      },
    ],
    subs: [
      {
        name: "Ham & Cheese Sub",
        price: "9.99",
      },
      {
        name: "Italian Sub",
        price: "9.99",
        description: "Ham, Salami, Pepperoni & cheese",
      },
      {
        name: "Turkey & Cheese Sub",
        price: "9.99",
      },
      {
        name: "Pizza Sub",
        price: "9.99",
        description: "Pepperoni, Ham & Cheese",
      },
    ],
    deliSalads: [
      {
        name: "Pickle Bologna/Salami & Cheese",
        price: "market",
      },
      {
        name: "Macaroni Salad",
        price: "market",
      },
      {
        name: "Cole Slaw",
        price: "market",
      },
      {
        name: "Chicken Salad",
        price: "market",
      },
      {
        name: "Tropical Fruit Salad",
        price: "market",
      },
      {
        name: "Potato Salad",
        price: "market",
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
      address: "",
      items: [],
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const handleQuantityChange = (item: any, delta: number, size?: string) => {
    const itemName = size ? `${item.name} (${size})` : item.name;
    const price = size
      ? Number(item.prices[size.toLowerCase()])
      : Number(item.price);
    const currentItems = form.getValues("items") || [];

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
      }
    } else if (delta > 0) {
      currentItems.push({ name: itemName, quantity: 1, price });
    }

    form.setValue("items", currentItems);

    if (delta > 0) {
      toast({
        title: "Added to cart",
        description: `${itemName} added to your order`,
      });
    }
  };

  const getItemQuantity = (itemName: string) => {
    const items = form.getValues("items") || [];
    const item = items.find((i: any) => i.name === itemName);
    return item?.quantity || 0;
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

  const renderMenuSection = (category: string, title: string) => {
    const items = menu[category as keyof typeof menu];

    if (category === "pizzas") {
      const pizzaItems = menu[category] as {
        regular: Array<{
          name: string;
          prices: { medium: string; large: string };
          description: string;
        }>;
        specialty: Array<{
          name: string;
          price: string;
          description: string;
        }>;
      };

      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Regular Pizzas</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {pizzaItems.regular.map((item: any) => (
                <Card key={item.name} className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                      <div className="mt-2">
                        <p>Medium (16"): ${item.prices.medium}</p>
                        <p>Large (22"): ${item.prices.large}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Medium</Label>
                      {renderQuantityControls(item, "medium")}
                      <Label>Large</Label>
                      {renderQuantityControls(item, "large")}
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
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                      <p className="mt-2">${item.price}</p>
                    </div>
                    {renderQuantityControls(item)}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {toppings && (
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
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.isArray(items) &&
          items.map((item: any) => (
            <Card key={item.name} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="mt-2">
                    {item.price === "market"
                      ? "Market Price"
                      : `$${item.price}`}
                  </p>
                </div>
                {item.price !== "market" && renderQuantityControls(item)}
              </div>
            </Card>
          ))}
      </div>
    );
  };

  const handleCheckout = async () => {
    try {
      const formData = form.getValues();
      const items = formData.items || [];

      if (!formData.customerName || !formData.phone || !formData.address) {
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
        address: formData.address,
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
          address: "",
          items: [],
        });

        navigate(`/orders/${response.id}`);
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
    }
  };

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
          <p>Sun—Thurs: 10am-9pm</p>
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
            {renderMenuSection("pizzas", "Pizza Menu")}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Daily Specials</h2>
            {renderMenuSection("specials", "Daily Specials")}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Subs - $9.99 each</h2>
            {renderMenuSection("subs", "Subs")}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Chicken</h2>
            {renderMenuSection("chicken", "Chicken")}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Sides & Baskets</h2>
            {renderMenuSection("sides", "Sides & Baskets")}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Deli Salads</h2>
            {renderMenuSection("deliSalads", "Deli Salads")}
          </section>
        </div>

        <div className="fixed bottom-4 right-4 flex gap-2">
          <Card className="p-4 shadow-lg">
            <h3 className="font-bold mb-2">Cart</h3>
            {form.watch("items")?.length > 0 ? (
              <>
                {form.watch("items").map((item: any, index: number) => (
                  <div key={index} className="text-sm">
                    {item.quantity}x {item.name} - $
                    {(item.price * item.quantity).toFixed(2)}
                  </div>
                ))}
                <div className="mt-2 font-bold">
                  Total: $
                  {form
                    .watch("items")
                    .reduce(
                      (acc: number, item: any) =>
                        acc + item.price * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </div>
                <Button className="mt-2 w-full" onClick={handleCheckout}>
                  Checkout
                </Button>
              </>
            ) : (
              <p className="text-gray-500">Cart is empty</p>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
