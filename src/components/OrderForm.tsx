import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { API_URL } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle, ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Please enter a valid address"),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
    })
  ),
});

interface OrderFormProps {
  menu: any;
  category: string;
  toppings?: string[];
  form: any;
}

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export function OrderForm({ menu, category, toppings, form }: OrderFormProps) {
  const { toast } = useToast();
  const items = menu[category];

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

  if (category === "pizzas") {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold mb-4">Regular Pizzas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {items.regular.map((item: any) => (
              <Card key={item.name} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
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
            {items.specialty.map((item: any) => (
              <Card key={item.name} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
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
      {items.map((item: any) => (
        <Card key={item.name} className="p-4">
          <div className="flex justify-between">
            <div>
              <h4 className="font-bold">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              <p className="mt-2">
                {item.price === "market" ? "Market Price" : `$${item.price}`}
              </p>
            </div>
            {item.price !== "market" && renderQuantityControls(item)}
          </div>
        </Card>
      ))}
    </div>
  );
}
