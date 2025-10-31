import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MinusCircle, PlusCircle, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ordersApi from "@/api/orders";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useInView } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";

// ===== PIZZA DISCOUNT CONFIGURATION =====
// Set this to true to enable the 10% pizza discount offer
const PIZZA_DISCOUNT_ENABLED = true;
// ==========================================

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  items: z.array(z.any()),
  cookingInstructions: z.string().optional(),
  deliveryType: z.enum(["pickup", "door-delivery"]).default("pickup"),
  deliveryAddress: z.string().optional(),
}).refine((data) => {
  // If door-delivery is selected, deliveryAddress is required
  if (data.deliveryType === "door-delivery") {
    return data.deliveryAddress && data.deliveryAddress.trim().length > 0;
  }
  return true;
}, {
  message: "Delivery address is required for door delivery",
  path: ["deliveryAddress"],
});

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  toppings?: string[];
}

// Fix the MenuItem component to handle toppings directly
const MenuItem = React.memo(({ 
  item, 
  onQuantityChange,
  toppings,
  selectedToppings,
  onToppingChange 
}: { 
  item: any; 
  onQuantityChange: (item: any, delta: number, size?: string, directToppings?: string[]) => void;
  toppings?: string[];
  selectedToppings?: Record<string, string[]>;
  onToppingChange?: (pizzaName: string, size: string, topping: string) => void;
}) => {
  const [quantity, setQuantity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showToppings, setShowToppings] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [toppingsSelected, setToppingsSelected] = useState(false);
  const { toast } = useToast();
  
  // Check if this pizza has multiple sizes
  const hasSizes = item.prices && (item.prices.medium || item.prices.large);
  
  // Check if this pizza can have toppings
  const canHaveToppings = item.name.includes("Toppings Pizza") && selectedSize && toppings && onToppingChange;
  
  // Get the currently selected toppings for this pizza
  const itemKey = canHaveToppings ? `${item.name}-${selectedSize}` : '';
  const currentToppings = (selectedToppings && itemKey) ? (selectedToppings[itemKey] || []) : [];

  // Determine required toppings based on pizza name
  let requiredToppings = 0;
  if (item.name.includes("1 Toppings")) {
    requiredToppings = 1;
  } else if (item.name.includes("2 Toppings")) {
    requiredToppings = 2;
  } else if (item.name.includes("3 Toppings")) {
    requiredToppings = 3;
  }

  // Track if we have enough toppings
  const hasEnoughToppings = currentToppings.length >= requiredToppings;

  // Update toppingsSelected when currentToppings changes
  useEffect(() => {
    if (hasEnoughToppings) {
      setToppingsSelected(true);
    }
  }, [currentToppings.length, hasEnoughToppings]);

  // Calculate price based on selected size
  const price = selectedSize && item.prices ? 
    Number(item.prices[selectedSize.toLowerCase()]) : 
    Number(item.price || 0);

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    // Automatically show toppings selector when size is selected and it needs toppings
    if (item.name.includes("Toppings Pizza") && toppings && onToppingChange) {
      const itemKey = `${item.name}-${size}`;
      const current = selectedToppings?.[itemKey] || [];
      if (current.length < requiredToppings && !toppingsSelected) {
        setShowToppings(true);
      }
    }
  };

  // Direct method to add item to cart with toppings
  const addItemToCartWithToppings = (selectedToppings: string[], quantity: number) => {
    if (!selectedSize) return;
    
    // Call the parent's quantity change function with toppings
    onQuantityChange(item, quantity, selectedSize, selectedToppings);
    
    // Update local quantity
    setQuantity(prev => prev + quantity);
  };

  const handleQuantityChange = (delta: number) => {
    // If adding to cart and no size is selected but pizza has sizes
    if (delta > 0 && hasSizes && !selectedSize) {
      toast({
        title: "Select Size",
        description: "Please select a size first.",
        variant: "default",
      });
      return;
    }
    
    // For pizza items that need toppings
    if (delta > 0 && canHaveToppings && requiredToppings > 0) {
      // If we already have enough toppings, add directly to cart
      if (currentToppings.length >= requiredToppings) {
        // Update local quantity
        const newQuantity = Math.max(0, quantity + delta);
        setQuantity(newQuantity);
        
        // Call parent's onQuantityChange to update the cart
        onQuantityChange(item, delta, selectedSize, currentToppings);
        return;
      }
      
      // Otherwise show the toppings selector
      setShowToppings(true);
      return;
    }
    
    // For regular items without toppings, update quantity directly
    const newQuantity = Math.max(0, quantity + delta);
    setQuantity(newQuantity);
    
    // Call parent's onQuantityChange to update the cart
    onQuantityChange(item, delta, selectedSize);
  };

  // Replace the ToppingSelector component with a wrapper that tracks completion
  const handleToppingSelectorClose = () => {
    setShowToppings(false);
    // If we have enough toppings, mark as selected to prevent reopening
    if (hasEnoughToppings) {
      setToppingsSelected(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow duration-200 shadow-md border border-gray-100">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 relative">
              <img 
                src={item.image} 
                alt={item.name}
                width="96"
                height="96"
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/placeholder.svg";
                }}
              />
              {isHovered && !hasSizes && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <PlusCircle className="h-6 w-6" />
                  </Button>
                </motion.div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm sm:text-base line-clamp-1">{item.name}</h4>
              {item.description && (
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.description}</p>
              )}
              
              {/* Price display */}
              {item.price === "market" ? (
                <p className="mt-1 sm:mt-2 text-sm sm:text-base">Market Price</p>
              ) : hasSizes ? (
                <div className="mt-1 sm:mt-2">
                  <div className="flex flex-col xs:flex-row gap-2 mb-2">
                    <Button
                      variant={selectedSize === "medium" ? "default" : "outline"}
                      size="sm"
                      className="text-xs px-2 py-0 h-7 w-full xs:w-auto"
                      onClick={() => handleSizeChange("medium")}
                    >
                      Medium - ${item.prices.medium}
                    </Button>
                    <Button
                      variant={selectedSize === "large" ? "default" : "outline"}
                      size="sm"
                      className="text-xs px-2 py-0 h-7 w-full xs:w-auto"
                      onClick={() => handleSizeChange("large")}
                    >
                      Large - ${item.prices.large}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 sm:mt-2 text-sm sm:text-base">${item.price}</p>
              )}
              
              {/* Toppings status indicator */}
              {canHaveToppings && (
                <div className="mt-1 flex items-center">
                  <div className="text-xs text-primary-700 font-medium mr-1">
                    {currentToppings.length === 0 ? (
                      <span className="text-amber-600">
                        * Select {requiredToppings} topping{requiredToppings > 1 ? 's' : ''}
                      </span>
                    ) : currentToppings.length < requiredToppings ? (
                      <span className="text-amber-600">
                        * Need {requiredToppings - currentToppings.length} more
                      </span>
                    ) : (
                      <span className="text-green-600">✓ Toppings selected</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected toppings display */}
              {canHaveToppings && currentToppings.length > 0 && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  Toppings: {currentToppings.join(', ')}
                </p>
              )}
              
              {/* Predefined toppings display */}
              {item.predefinedToppings && item.predefinedToppings.length > 0 && (
                <p className="text-xs text-green-600 mt-1 line-clamp-1">
                  Includes: {item.predefinedToppings.join(', ')}
                </p>
              )}
              
              {/* Quantity controls */}
              {item.price !== "market" && (
                <div className="flex flex-col gap-2 mt-1 sm:mt-2">
                  <div className="flex justify-between items-center">
                    {selectedSize && (
                      <div className="text-xs sm:text-sm font-medium">
                        {selectedSize === "medium" ? "Medium" : "Large"}
                      </div>
                    )}
                    
                    {canHaveToppings && (
                      <Button 
                        variant={currentToppings.length < requiredToppings ? "default" : "outline"}
                        size="sm" 
                        className="text-xs h-7 px-2 whitespace-nowrap touch-manipulation"
                        onClick={() => {
                          setShowToppings(true);
                          setToppingsSelected(false); // Reset the selection flag when manually editing
                        }}
                      >
                        {currentToppings.length === 0 ? "Add Toppings" : "Edit Toppings"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      aria-label="Decrease quantity"
                      className="hover:bg-red-100 h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
                      disabled={quantity <= 0}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      aria-label="Increase quantity"
                      className={`h-9 w-9 sm:h-10 sm:w-10 touch-manipulation ${
                        ((hasSizes && !selectedSize) || (canHaveToppings && currentToppings.length < requiredToppings && !toppingsSelected))
                          ? "hover:bg-amber-100 border-amber-300"
                          : "hover:bg-green-100"
                      }`}
                    >
                      <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Toppings selector */}
      {item.name.includes("Toppings Pizza") && selectedSize && toppings && onToppingChange && (
        <ToppingSelector
          pizzaName={item.name}
          size={selectedSize}
          toppings={toppings}
          selectedToppings={currentToppings}
          onToppingChange={onToppingChange}
          onClose={handleToppingSelectorClose}
          isOpen={showToppings}
          requiredToppings={requiredToppings}
          item={item}
          addToCartDirectly={(item, qty, size, toppings) => {
            // Simply call the parent's onQuantityChange directly with toppings
            if (selectedSize) {
              onQuantityChange(item, qty, selectedSize, toppings);
              setQuantity(prev => prev + qty);
            }
          }}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.item.name === nextProps.item.name;
});

// Completely revamp the ToppingSelector component to fix selection issues
const ToppingSelector = React.memo(({ 
  pizzaName, 
  size, 
  toppings,
  selectedToppings,
  onToppingChange,
  onClose,
  isOpen,
  requiredToppings,
  item,
  addToCartDirectly
}: { 
  pizzaName: string;
  size: string;
  toppings: string[];
  selectedToppings: string[];
  onToppingChange: (pizzaName: string, size: string, topping: string) => void;
  onClose: () => void;
  isOpen: boolean;
  requiredToppings: number;
  item?: any;
  addToCartDirectly?: (item: any, quantity: number, size: string, toppings: string[]) => void;
}) => {
  const [localToppings, setLocalToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  
  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalToppings([...selectedToppings]);
    }
  }, [isOpen, selectedToppings]);
  
  if (!isOpen) return null;

  // Handle topping toggle with local state
  const handleToggleTopping = (topping: string) => {
    setLocalToppings(prev => {
      const isSelected = prev.includes(topping);
      
      if (isSelected) {
        // Remove topping
        const newToppings = prev.filter(t => t !== topping);
        return newToppings;
      } else {
        // Add topping - only if we haven't reached the limit
        if (prev.length >= requiredToppings) {
          // If we're at the limit, replace the first topping with the new one
          const newToppings = [...prev.slice(1), topping];
          toast({
            title: `Maximum ${requiredToppings} topping${requiredToppings > 1 ? 's' : ''} allowed`,
            description: `Replaced ${prev[0]} with ${topping}`,
            variant: "default",
          });
          return newToppings;
        }
        
        // Add the new topping if under the limit
        const newToppings = [...prev, topping];
        return newToppings;
      }
    });
  };
  
  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };
  
  // Apply changes when done
  const handleDone = () => {
    // Process changes for the toppings state
    for (const topping of toppingsToRemove) {
      onToppingChange(pizzaName, size, topping);
    }
    
    for (const topping of toppingsToAdd) {
      onToppingChange(pizzaName, size, topping);
    }
    
    // Add to cart if we have the necessary properties
    if (item && addToCartDirectly && localToppings.length >= requiredToppings) {
      try {
        // Create a direct copy of the toppings array to pass
        const toppingsCopy = [...localToppings];
        
        // Add directly to cart with proper parameters
        addToCartDirectly(item, quantity, size, toppingsCopy);
      } catch (error) {
        // Silent error handling in production
      }
    }
    
    onClose();
  };

  // Calculate which toppings need to change
  const toppingsToRemove = selectedToppings.filter(t => !localToppings.includes(t));
  const toppingsToAdd = localToppings.filter(t => !selectedToppings.includes(t));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg p-3 sm:p-4 max-h-[90vh] overflow-auto w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 pb-2 border-b">
          <h3 className="font-bold text-base sm:text-lg line-clamp-1">
            {pizzaName} ({size}) - Select Toppings
          </h3>
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600 mb-3">
          {localToppings.length < requiredToppings ? (
            <span className="text-orange-600 font-medium">
              Please select exactly {requiredToppings} topping{requiredToppings !== 1 ? 's' : ''} 
              ({localToppings.length}/{requiredToppings} selected)
            </span>
          ) : (
            <span className="text-green-600 font-medium">
              ✓ All {requiredToppings} required toppings selected!
              {requiredToppings === localToppings.length && 
                ` (Maximum ${requiredToppings} allowed)`}
            </span>
          )}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {toppings.map((topping) => {
            const isSelected = localToppings.includes(topping);
            return (
              <button 
                key={topping} 
                type="button"
                className={`
                  p-3 border rounded-md flex items-center gap-2 cursor-pointer touch-manipulation
                  text-left transition-colors duration-150
                  ${isSelected ? 'bg-green-50 border-green-600' : 'hover:bg-gray-100'}
                `}
                onClick={() => handleToggleTopping(topping)}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-5 w-5 border rounded-full ${isSelected ? 'border-green-600' : 'border-gray-300'}`}>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm sm:text-base">{topping}</span>
              </button>
            );
          })}
        </div>
        
        {localToppings.length >= requiredToppings && (
          <div className="mt-4 pt-2 border-t">
            <p className="text-sm font-medium mb-2">Quantity:</p>
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                className="h-8 w-8"
                disabled={quantity <= 1}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-8 w-8"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-between sticky bottom-0 pt-2 border-t bg-white">
          <span className="text-xs text-gray-500 self-center">
            {localToppings.length} selected
          </span>
          <div className="flex gap-2">
            <button 
              type="button"
              className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button"
              className={`px-3 py-1 rounded text-sm text-white 
                ${localToppings.length >= requiredToppings 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
              onClick={handleDone}
              disabled={localToppings.length !== requiredToppings}
            >
              {localToppings.length === requiredToppings 
                ? "Add to Cart" 
                : `Select Exactly ${requiredToppings - localToppings.length} More`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Update MenuSection component to pass the correct function signature
const MenuSection = React.memo(({ 
  category, 
  title, 
  items,
  onQuantityChange,
  toppings,
  selectedToppings,
  onToppingChange,
  color
}: { 
  category: string;
  title: string;
  items: any;
  onQuantityChange: (item: any, delta: number, size?: string, directToppings?: string[]) => void;
  toppings: string[];
  selectedToppings: Record<string, string[]>;
  onToppingChange: (pizzaName: string, size: string, topping: string) => void;
  color?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-4 first:pt-0"
    >
      <h2 className={`text-2xl font-bold mb-6 ${color || 'text-green-600'} border-b-2 pb-2 inline-block`}>{title}</h2>
      {isInView ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.isArray(items) ? (
            items.map((item: any) => (
              <MenuItem 
                key={item.name} 
                item={item} 
                onQuantityChange={onQuantityChange}
                toppings={toppings}
                selectedToppings={selectedToppings}
                onToppingChange={onToppingChange}
              />
            ))
          ) : (
            <>
              <div>
                <h3 className="text-lg font-bold mb-4 text-green-600">Regular Pizzas</h3>
                <div className="grid gap-4">
                  {items.regular.map((item: any) => (
                    <MenuItem 
                      key={item.name}
                      item={item}
                      onQuantityChange={onQuantityChange}
                      toppings={toppings}
                      selectedToppings={selectedToppings}
                      onToppingChange={onToppingChange}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4 text-orange-600">Specialty Pizzas</h3>
                <div className="grid gap-4">
                  {items.specialty.map((item: any) => (
                    <MenuItem 
                      key={item.name} 
                      item={item}
                      onQuantityChange={onQuantityChange}
                      toppings={toppings}
                      selectedToppings={selectedToppings}
                      onToppingChange={onToppingChange}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <LoadingSpinner size={24} />
        </div>
      )}
    </motion.div>
  );
});

// Make toppings visible in cart with debug information
const CartSummary = React.memo(({ 
  cart, 
  cartTotal, 
  isSubmitting, 
  onCheckout,
  onRemoveItem,
  isPlacingOrder,
  setIsPlacingOrder,
  isPizzaDiscountDay
}: { 
  cart: CartItem[];
  cartTotal: number;
  isSubmitting: boolean;
  onCheckout: (customerData: { customerName: string; phone: string; email: string; cookingInstructions?: string; deliveryType?: string; deliveryAddress?: string }) => void;
  onRemoveItem: (index: number) => void;
  isPlacingOrder: boolean;
  setIsPlacingOrder: React.Dispatch<React.SetStateAction<boolean>>;
  isPizzaDiscountDay?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const isAnyItemInCart = cart.length > 0;
  const { toast } = useToast();
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      items: [],
      cookingInstructions: "",
      deliveryType: "pickup",
      deliveryAddress: "",
    },
  });

  const deliveryType = form.watch("deliveryType");

  // Debug output
  useEffect(() => {
    // No console logs here
  }, [cart]);

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your order",
        variant: "destructive",
      });
      return;
    }
    setShowCheckoutForm(true);
  };

  const handleSubmitForm = (data: z.infer<typeof orderSchema>) => {
    // Set form data in cart items
    form.setValue('items', cart);
    
    // Instead of calling onCheckout directly, pass the form data
    setIsPlacingOrder(true);
    onCheckout({
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      cookingInstructions: data.cookingInstructions,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress
    });
    
    setShowCheckoutForm(false);
  };

  // Keep the original handleCheckout for compatibility
  const handleCheckout = async () => {
    // This is now a legacy function, use handleSubmitForm instead
    const formValues = form.getValues();
    await handleSubmitForm({
      customerName: formValues.customerName || "",
      phone: formValues.phone || "",
      email: formValues.email || "",
      cookingInstructions: formValues.cookingInstructions
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-96 z-40"
    >
      <Card className="rounded-t-lg md:rounded-lg shadow-xl border border-orange-200">
        <div 
          className="p-3 sm:p-4 cursor-pointer md:cursor-default flex justify-between items-center bg-orange-600 text-white rounded-t-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Cart {isAnyItemInCart ? `(${cart.length})` : ''}</h3>
            {isAnyItemInCart && (
              <span className="text-sm font-semibold bg-white text-orange-600 px-2 py-0.5 rounded-full">${cartTotal.toFixed(2)}</span>
            )}
          </div>
          <div className="md:hidden">
            {isExpanded ? <X className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded || !isAnyItemInCart ? "auto" : (window.innerWidth >= 768 ? "auto" : 0) 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden bg-gray-50"
        >
          <div className="p-3 sm:p-4 border-t">
            <div className="max-h-[60vh] overflow-y-auto">
              {isAnyItemInCart ? (
                <>
                  {!showCheckoutForm ? (
                    <>
                      {cart.map((item, index) => {
                        return (
                          <div key={index} className="text-sm mb-3 bg-white p-3 rounded-md shadow-md border-l-4 border-orange-600">
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                              <span className="font-bold">{item.quantity}x {item.name}</span>
                              <div className="flex items-center">
                                <span className="mr-2 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-gray-500 hover:text-red-500"
                                  onClick={() => onRemoveItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Item details with debugging info */}
                            <div className="space-y-2 text-xs">
                              {item.size && (
                                <div>
                                  <span className="text-gray-500">Size:</span> <span className="font-medium">{item.size}</span>
                                </div>
                              )}
                              
                              {/* Only show toppings section for relevant items */}
                              {(item.name.includes("Toppings Pizza") || (item.toppings && item.toppings.length > 0)) && (
                                <div className="border-t border-dashed pt-2 mt-1">
                                  <div className="font-medium text-green-600 mb-1 flex justify-between">
                                    <span>Toppings:</span> 
                                    <span className="bg-gray-100 px-1 rounded text-xs">
                                      {item.toppings ? `${item.toppings.length} selected` : "none"}
                                    </span>
                                  </div>
                                  
                                  {item.toppings && item.toppings.length > 0 ? (
                                    <div className="pl-2 grid grid-cols-2 gap-x-1 border-l-2 border-green-600 bg-green-50 p-2 rounded">
                                      {item.toppings.map((topping, i) => (
                                        <div key={i} className="flex items-center">
                                          <span className="text-xs">• {topping}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-red-500 italic bg-red-50 p-2 rounded">
                                      No toppings selected for this pizza.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                        const hasPizzaDiscount = isPizzaDiscountDay && cart.some(item => item.name.toLowerCase().includes('pizza'));
                        const pizzaSubtotal = hasPizzaDiscount ? cart
                          .filter(item => item.name.toLowerCase().includes('pizza'))
                          .reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
                        const discountAmount = pizzaSubtotal * 0.1;
                        
                        return (
                          <div className="mt-3 space-y-1">
                            {hasPizzaDiscount && (
                              <div className="text-sm text-green-700 font-medium flex justify-between items-center">
                                <span>🍕 Pizza Discount (10%):</span>
                                <span>${discountAmount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="font-bold flex justify-between items-center p-3 bg-orange-50 rounded-md shadow-md border border-orange-200">
                              <span>Total:</span>
                              <span className="text-orange-600 text-lg">${cartTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}
                      <Button 
                        className="mt-3 w-full h-12 text-base font-bold shadow-md bg-orange-600 hover:bg-orange-700" 
                        onClick={handlePlaceOrderClick}
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? (
                          <>
                            <LoadingSpinner size={20} className="mr-2" />
                            Processing...
                          </>
                        ) : "Place Order"}
                      </Button>
                    </>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4 pt-2">
                        <div className="text-lg font-bold text-orange-600 mb-2">Customer Information</div>
                        
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
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
                                <Input placeholder="Phone number" {...field} />
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
                                <Input placeholder="Email address" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="deliveryType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Type</FormLabel>
                              <FormControl>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="pickup"
                                      checked={field.value === "pickup"}
                                      onChange={() => field.onChange("pickup")}
                                      className="h-4 w-4 cursor-pointer accent-orange-600"
                                      style={{ accentColor: '#ea580c' }}
                                    />
                                    <span>Pickup</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="door-delivery"
                                      checked={field.value === "door-delivery"}
                                      onChange={() => field.onChange("door-delivery")}
                                      className="h-4 w-4 cursor-pointer accent-orange-600"
                                      style={{ accentColor: '#ea580c' }}
                                    />
                                    <span>Door Delivery</span>
                                  </label>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {deliveryType === "door-delivery" && (
                          <FormField
                            control={form.control}
                            name="deliveryAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter your delivery address..."
                                    required={true}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="cookingInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cooking Instructions (Optional)</FormLabel>
                              <FormControl>
                                <textarea
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Any special cooking instructions..."
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        
                        <div className="mt-3 font-bold flex justify-between items-center p-3 bg-orange-50 rounded-md shadow-md border border-orange-200">
                          <span>Total:</span>
                          <span className="text-orange-600 text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            variant="outline"
                            className="flex-1" 
                            onClick={() => setShowCheckoutForm(false)}
                          >
                            Back
                          </Button>
                          <Button 
                            type="submit"
                            className="flex-1 bg-orange-600 hover:bg-orange-700" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <LoadingSpinner className="mr-2" />
                            ) : (
                              "Place Order"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-center py-2">Your cart is empty</p>
              )}
            </div>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
});

export default function PizzaOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [showToppingSelector, setShowToppingSelector] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("pizzas");

  const parentRef = useRef<HTMLDivElement>(null);

  // Check if today is Monday-Friday for pizza discount
  const isPizzaDiscountDay = useMemo(() => {
    if (!PIZZA_DISCOUNT_ENABLED) return false; // Check if discount is enabled
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  }, []);

  // Initialize cart state with localStorage value to prevent clearing
  const getInitialCart = (): CartItem[] => {
    try {
      const savedCart = localStorage.getItem('items');
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Error parsing saved cart:', error);
    }
    return [];
  };

  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  
  // Save cart to localStorage whenever it changes (but skip initial render)
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    localStorage.setItem('items', JSON.stringify(cart));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }, [cart]);
  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Apply 10% discount on pizzas for Monday-Friday
    if (isPizzaDiscountDay) {
      const pizzaDiscount = cart
        .filter(item => item.name.toLowerCase().includes('pizza'))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      return subtotal - (pizzaDiscount * 0.1);
    }
    
    return subtotal;
  }, [cart, isPizzaDiscountDay]);

  // Add direct function to add items to cart with toppings
  const addToCartWithToppings = useCallback((
    item: any, 
    quantity: number, 
    size: string, 
    toppings: string[]
  ) => {
    // Ensure toppings is always a valid array
    const safeToppings = Array.isArray(toppings) ? [...toppings] : [];
    
    // Generate the item name with size
    const itemName = size ? `${item.name} (${size})` : item.name;
    
    // Calculate the price
    const price = size 
      ? Number(item.prices[size.toLowerCase()]) 
      : Number(item.price || 0);
    
    // Create a new cart item with toppings
    const newCartItem: CartItem = {
      name: itemName,
      quantity: quantity,
      price: price,
      size: size,
      toppings: safeToppings // Use validated toppings array
    };
    
    // Update the cart state
    setCart(prev => {
      // Check if item already exists in cart
      const existingIndex = prev.findIndex(i => i.name === itemName);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedCart = [...prev];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + quantity,
          toppings: safeToppings // Ensure toppings are updated with validated array
        };
        return updatedCart;
      } else {
        // Add new item
        return [...prev, newCartItem];
      }
    });
  }, []);

  const menu = {
    pizzas: {
      regular: [
        {
          name: "1 Toppings Pizza",
          prices: { medium: "13.99", large: "16.99" },
          description: "Choose one topping from our selection",
          image: "/images/pizza1.jpg"
        },
        {
          name: "2 Toppings Pizza",
          prices: { medium: "14.99", large: "17.99" },
          description: "Choose two toppings from our selection",
          image: "/images/pizza2.jpg"
        },
        {
          name: "3 Toppings Pizza",
          prices: { medium: "15.99", large: "18.99" },
          description: "Choose three toppings from our selection",
          image: "/images/pizza3.jpg"
        },
        {
          name: "Supreme Pizza",
          prices: { medium: "20.99", large: "22.99" },
          description: "Pepperoni, sausage, onions, peppers, olives",
          image: "/images/pizza4.jpg",
          predefinedToppings: ["Pepperoni", "Sausage", "Onions", "Green Peppers", "Black Olives"]
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
          name: "The Big Pig Pizza",
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
          name: "Hawaiian Pizza",
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
        price: "7.99",
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
        price: "8.99",
        image: "/images/burger.jpg"
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

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: Object.keys(menu).length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500,
    overscan: 2,
  });

  // Optimize menu data with reordered sections
  const menuSections = useMemo(() => {
    const orderedCategories = ['pizzas', 'burgers', 'sides', 'chicken', 'subs', 'deliSalads', 'specials'];
    return orderedCategories
      .filter(category => menu[category])
      .map(category => {
        let color = 'text-green-600';
        if (category === 'burgers') color = 'text-orange-600';
        else if (category === 'sides') color = 'text-green-600';
        else if (category === 'chicken') color = 'text-orange-600';
        else if (category === 'subs') color = 'text-green-600';
        else if (category === 'deliSalads') color = 'text-orange-600';
        else if (category === 'specials') color = 'text-green-600';
        
        return {
          category,
          title: category.charAt(0).toUpperCase() + category.slice(1),
          items: menu[category],
          color
        };
      });
  }, []);

  // Optimize form handling
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      items: [],
    },
  });

  // Handle topping selection with improved reliability
  const handleToppingSelection = useCallback((pizzaName: string, size: string, topping: string) => {
    if (!pizzaName || !size || !topping) {
      return;
    }
    
    const itemKey = `${pizzaName}-${size}`;
    
    setSelectedToppings(prev => {
      // Deep copy the previous state
      const newState = { ...prev };
      
      // Get current toppings or initialize empty array
      const currentToppings = newState[itemKey] ? [...newState[itemKey]] : [];
      
      // Check if topping is already selected
      const toppingIndex = currentToppings.indexOf(topping);
      
      if (toppingIndex >= 0) {
        // Remove topping if already selected
        currentToppings.splice(toppingIndex, 1);
      } else {
        // Add topping if not selected
        currentToppings.push(topping);
      }
      
      // Update the state with new toppings array
      newState[itemKey] = currentToppings;
      
      return newState;
    });
  }, []);

  // Fix the handleQuantityChange function to properly store toppings
  const handleQuantityChange = useCallback((item: any, delta: number, size?: string, directToppings?: string[]) => {
    if (delta === 0) return; // No change to make
    
    // Ensure directToppings is always a valid array if provided
    const safeToppings = directToppings && Array.isArray(directToppings) 
      ? [...directToppings] 
      : item.predefinedToppings && Array.isArray(item.predefinedToppings)
        ? [...item.predefinedToppings]
        : [];
    
    setCart(prevCart => {
      const newCart = [...prevCart];
      const itemKey = size ? `${item.name} (${size})` : item.name;
      const existingItemIndex = newCart.findIndex(i => i.name === itemKey);
      
      if (existingItemIndex >= 0) {
        // Item exists in cart, update quantity
        const newQuantity = Math.max(0, newCart[existingItemIndex].quantity + delta);
        
        if (newQuantity === 0) {
          // Remove item if quantity becomes 0
          newCart.splice(existingItemIndex, 1);
        } else {
          // Update quantity
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newQuantity,
            // If directToppings were provided during update, use them
            ...(safeToppings.length > 0 ? { toppings: safeToppings } : {})
          };
        }
      } else if (delta > 0) {
        // Add new item to cart
        let itemToppings: string[] = [];
        
        // IMPORTANT: If direct toppings were provided, use them as priority
        if (safeToppings.length > 0) {
          itemToppings = safeToppings; // Already a safe copy
        } 
        // Otherwise try to get them from the selected toppings state
        else if (item.name.includes("Toppings Pizza") && size) {
          const toppingKey = `${item.name}-${size}`;
          const toppingsFromState = selectedToppings[toppingKey];
          if (toppingsFromState && Array.isArray(toppingsFromState) && toppingsFromState.length > 0) {
            itemToppings = [...toppingsFromState]; // Make a copy
          }
        }
        
        // Create the new cart item with GUARANTEED toppings array
        const newItem = {
          name: itemKey,
          quantity: delta,
          price: size ? Number(item.prices[size.toLowerCase()]) : Number(item.price),
          toppings: itemToppings, // This should now always be a valid array
          size: size
        };
        
        newCart.push(newItem);
      }
      
      // Always return a new array to trigger re-render
      return [...newCart];
    });
  }, [selectedToppings]);

  // Add function to remove items from cart
  const handleRemoveFromCart = useCallback((index: number) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
  }, []);

  // Add a new function to handle the customer data submission
  const handleCustomerSubmit = async (customerData: { 
    customerName: string; 
    phone: string; 
    email: string;
    cookingInstructions?: string;
    deliveryType?: "pickup" | "door-delivery";
    deliveryAddress?: string;
  }) => {
    try {
      setIsSubmitting(true);
      // Don't set isPlacingOrder here since it's now being set in the form submit handler

      if (cart.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your order",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsPlacingOrder(false);
        return;
      }

      // Use the customerData passed from the CartSummary component
      if (!customerData.customerName || !customerData.phone || !customerData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsPlacingOrder(false);
        return;
      }

      // Create detailed order items with toppings and size information
      const orderItems = cart.map((item) => {
        // Make sure toppings is always an array
        const safeToppings = Array.isArray(item.toppings) ? [...item.toppings] : [];
        
        return {
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          size: item.size || undefined,
          toppings: safeToppings // Use our safe array
        };
      });
      
      const orderData = {
        customerName: customerData.customerName,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.deliveryType === "door-delivery" ? customerData.deliveryAddress || "" : "Pickup",
        deliveryType: (customerData.deliveryType || "pickup") as "pickup" | "door-delivery",
        items: orderItems,
        totalAmount: cartTotal,
        cookingInstructions: customerData.cookingInstructions || ""
      };

      const response = await ordersApi.createOrder(orderData);

      if (response) {
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been received and is being processed.",
        });

        // Reset form and cart
        form.reset({
          customerName: "",
          phone: "",
          email: "",
          items: [],
          cookingInstructions: "",
        });
        setCart([]);
        localStorage.removeItem('items');
        setSelectedToppings({});

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
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [navigate]);

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
      <div className="shadow-lg">
        <Header />
      </div>
      {isPizzaDiscountDay && (
        <div className="bg-orange-600 text-white text-center py-2 px-4 shadow-md">
          <p className="text-sm sm:text-base font-medium">
            🍕 Limited Time Offer: 10% OFF All Pizzas (Monday-Friday Only!)
          </p>
        </div>
      )}
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-12 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 sm:gap-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Sandy's Market Menu</h1>
        </div>

        <div className="space-y-0">
          {menuSections.map((section) => (
            <MenuSection 
              key={section.category}
              category={section.category}
              title={section.title}
              items={section.items}
              onQuantityChange={handleQuantityChange}
              toppings={toppings}
              selectedToppings={selectedToppings}
              onToppingChange={handleToppingSelection}
              color={section.color}
            />
          ))}
        </div>

        <CartSummary 
          cart={cart}
          cartTotal={cartTotal}
          isSubmitting={isSubmitting}
          onCheckout={handleCustomerSubmit}
          onRemoveItem={handleRemoveFromCart}
          isPlacingOrder={isPlacingOrder}
          setIsPlacingOrder={setIsPlacingOrder}
          isPizzaDiscountDay={isPizzaDiscountDay}
        />
      </main>
      <Footer />
    </div>
  );
}
