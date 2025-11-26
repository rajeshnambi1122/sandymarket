import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { motion } from "framer-motion";
import { menu, toppings } from "@/data/menu";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ordersApi from "@/api/orders";
import {
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  X,
  ShoppingBag,
  ChevronUp,
  Loader2
} from "lucide-react";
import { useInView } from "framer-motion";

// ===== PIZZA DISCOUNT CONFIGURATION =====
// Set this to true to enable the 10% pizza discount offer
const PIZZA_DISCOUNT_ENABLED = import.meta.env.VITE_IS_PIZZA_DISCOUNT_ENABLED;
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

import { CartItem } from "@/types/index";

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
        <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 shadow-lg border border-orange-100/50 rounded-2xl bg-white group h-full hover:-translate-y-1">
          <div className="flex gap-4 sm:gap-5 h-full">
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 relative rounded-xl overflow-hidden shadow-sm">
              <img
                src={item.image}
                alt={item.name}
                width="112"
                height="112"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 hover:text-white rounded-full w-10 h-10"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <PlusCircle className="h-8 w-8" />
                  </Button>
                </motion.div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-heading font-bold text-base sm:text-lg line-clamp-1 text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</h4>
                  {item.price !== "market" && !hasSizes && (
                    <span className="font-medium text-orange-600 text-lg">${item.price}</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>

              <div className="mt-3">
                {/* Price display for market/sizes */}
                {item.price === "market" ? (
                  <p className="text-sm font-medium text-orange-600">Market Price</p>
                ) : hasSizes && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button
                      variant={selectedSize === "medium" ? "default" : "outline"}
                      size="sm"
                      className={`text-xs px-3 h-8 rounded-lg transition-all ${selectedSize === "medium" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md" : "border-orange-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"}`}
                      onClick={() => handleSizeChange("medium")}
                    >
                      Medium - ${item.prices.medium}
                    </Button>
                    <Button
                      variant={selectedSize === "large" ? "default" : "outline"}
                      size="sm"
                      className={`text-xs px-3 h-8 rounded-lg transition-all ${selectedSize === "large" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md" : "border-orange-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"}`}
                      onClick={() => handleSizeChange("large")}
                    >
                      Large - ${item.prices.large}
                    </Button>
                  </div>
                )}

                {/* Toppings status indicator */}
                {canHaveToppings && (
                  <div className="mb-2 flex items-center">
                    <div className="text-xs font-medium px-2 py-1 rounded-md bg-orange-50 border border-orange-100 inline-block">
                      {currentToppings.length === 0 ? (
                        <span className="text-orange-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          Select {requiredToppings} toppings
                        </span>
                      ) : currentToppings.length < requiredToppings ? (
                        <span className="text-orange-600">
                          Need {requiredToppings - currentToppings.length} more
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Toppings selected
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected toppings display */}
                {canHaveToppings && currentToppings.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1 italic">
                    <span className="font-medium not-italic text-gray-700">Selected:</span> {currentToppings.join(', ')}
                  </p>
                )}

                {/* Predefined toppings display */}
                {item.predefinedToppings && item.predefinedToppings.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                    <span className="font-medium text-gray-700">Includes:</span> {item.predefinedToppings.join(', ')}
                  </p>
                )}

                {/* Quantity controls */}
                {item.price !== "market" && (
                  <div className="flex flex-wrap justify-between items-end gap-2">
                    <div className="flex items-center">
                      {selectedSize && (
                        <span className="text-xs font-medium text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded-md">
                          {selectedSize === "medium" ? "Medium" : "Large"}
                        </span>
                      )}

                      {canHaveToppings && (
                        <Button
                          variant={currentToppings.length < requiredToppings ? "default" : "outline"}
                          size="sm"
                          className={`text-xs h-8 px-3 rounded-lg shadow-sm transition-all ${currentToppings.length < requiredToppings ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200" : "border-gray-200 text-gray-600"}`}
                          onClick={() => {
                            setShowToppings(true);
                            setToppingsSelected(false);
                          }}
                        >
                          {currentToppings.length === 0 ? "Add Toppings" : "Edit Toppings"}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        aria-label="Decrease quantity"
                        className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-gray-500 hover:text-red-500 transition-all"
                        disabled={quantity <= 0}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-bold text-gray-700 text-sm">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        aria-label="Increase quantity"
                        className={`h-7 w-7 rounded-md hover:bg-white hover:shadow-sm transition-all
                           text-gray-500 hover:text-green-500`}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
    const toppingsToRemove = selectedToppings.filter(t => !localToppings.includes(t));
    const toppingsToAdd = localToppings.filter(t => !selectedToppings.includes(t));

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

  const remainingToppings = Math.max(0, requiredToppings - localToppings.length);
  const isComplete = localToppings.length >= requiredToppings;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 text-white flex justify-between items-start shrink-0">
          <div>
            <h3 className="font-heading font-bold text-xl leading-tight">
              Customize Your Pizza
            </h3>
            <p className="text-orange-100 text-sm mt-1">
              {pizzaName} ({size})
            </p>
          </div>
          <button
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress / Status Bar */}
        <div className="bg-orange-50 px-5 py-3 border-b border-orange-100 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {isComplete ? "Selection Complete" : `Select ${requiredToppings} Toppings`}
            </span>
            <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
              {localToppings.length}/{requiredToppings}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (localToppings.length / requiredToppings) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {!isComplete
              ? `Please choose ${remainingToppings} more topping${remainingToppings !== 1 ? 's' : ''}`
              : "You're all set! Click 'Add to Cart' to continue."}
          </p>
        </div>

        {/* Toppings List (Scrollable) */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {toppings.map((topping) => {
              const isSelected = localToppings.includes(topping);
              return (
                <motion.button
                  key={topping}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className={`
                    relative p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                    ${isSelected
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50'}
                  `}
                  onClick={() => handleToggleTopping(topping)}
                >
                  <span className={`font-medium ${isSelected ? 'text-orange-800' : 'text-gray-700'}`}>
                    {topping}
                  </span>
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                    ${isSelected
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white border-gray-300 group-hover:border-orange-300'}
                  `}>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {isComplete && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <span className="font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  className="h-8 w-8 rounded-md hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <MinusCircle className="h-4 w-4 text-gray-600" />
                </Button>
                <span className="w-8 text-center font-bold text-gray-800">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  className="h-8 w-8 rounded-md hover:bg-gray-100"
                >
                  <PlusCircle className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 py-6 text-base rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 py-6 text-base font-bold rounded-xl shadow-lg transition-all
                ${isComplete
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
              onClick={handleDone}
              disabled={!isComplete}
            >
              {isComplete ? `Add to Cart - $${((item?.prices?.[size.toLowerCase()] || 0) * quantity).toFixed(2)}` : 'Select Toppings'}
            </Button>
          </div>
        </div>
      </motion.div>
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
      <h2 className={`text-2xl font-bold font-heading mb-6 ${color || 'text-green-600'} border-b-2 pb-2 inline-block`}>{title}</h2>
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
                <h3 className="text-lg font-bold font-heading mb-4 text-green-600">Regular Pizzas</h3>
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
                <h3 className="text-lg font-bold font-heading mb-4 text-orange-600">Specialty Pizzas</h3>
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
  discountInfo
}: {
  cart: CartItem[];
  cartTotal: number;
  isSubmitting: boolean;
  onCheckout: (customerData: { customerName: string; phone: string; email: string; cookingInstructions?: string; deliveryType?: string; deliveryAddress?: string }) => void;
  onRemoveItem: (index: number) => void;
  isPlacingOrder: boolean;
  setIsPlacingOrder: React.Dispatch<React.SetStateAction<boolean>>;
  discountInfo: { subtotal: number; pizzaSubtotal: number; discountAmount: number; total: number; hasDiscount: boolean };
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
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

  // Load user email from localStorage and lock it
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && userData.email) {
          setUserEmail(userData.email);
          form.setValue('email', userData.email);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [form]);

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
      <Card className="rounded-t-2xl md:rounded-2xl shadow-2xl border border-orange-100/50 overflow-hidden bg-white/95 backdrop-blur-sm">
        <div
          className="p-3 cursor-pointer md:cursor-default flex justify-between items-center bg-gradient-to-r from-orange-600 to-orange-500 text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base leading-none">Your Order</h3>
              <p className="text-[10px] text-orange-100 font-medium mt-0.5">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAnyItemInCart && (
              <span className="font-bold text-base bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                ${cartTotal.toFixed(2)}
              </span>
            )}
            <div className="md:hidden bg-white/10 p-1 rounded-full">
              {isExpanded ? <X className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
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
                      <div className="mt-3 space-y-1">
                        {discountInfo.hasDiscount && (
                          <div className="text-sm text-green-700 font-medium flex justify-between items-center">
                            <span>🍕 Pizza Discount (10%):</span>
                            <span>${discountInfo.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="font-bold flex justify-between items-center p-3 bg-orange-50 rounded-md shadow-md border border-orange-200">
                          <span>Total:</span>
                          <span className="text-orange-600 text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
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
                                <Input
                                  placeholder="Email address"
                                  {...field}
                                  disabled={!!userEmail}
                                  className={userEmail ? "bg-gray-100 cursor-not-allowed" : ""}
                                />
                              </FormControl>
                              {userEmail && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ✅From Account
                                </p>
                              )}
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
  usePageTitle("Order Food | Sandy's Market");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [showToppingSelector, setShowToppingSelector] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("pizzas");

  // Check if today is Monday-Friday for pizza discount
  const isPizzaDiscountDay = useMemo(() => {
    if (PIZZA_DISCOUNT_ENABLED === "false") return false; // Check if discount is enabled

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

  // Single source of truth for pizza discount calculation
  const discountInfo = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log("isPizzaDiscountDay", isPizzaDiscountDay);

    // Calculate pizza discount if applicable
    if (isPizzaDiscountDay && cart.some(item => item.name.toLowerCase().includes('pizza'))) {
      const pizzaSubtotal = cart
        .filter(item => item.name.toLowerCase().includes('pizza'))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountAmount = pizzaSubtotal * 0.1;
      const total = subtotal - discountAmount;

      return {
        subtotal,
        pizzaSubtotal,
        discountAmount,
        total,
        hasDiscount: true
      };
    }

    return {
      subtotal,
      pizzaSubtotal: 0,
      discountAmount: 0,
      total: subtotal,
      hasDiscount: false
    };
  }, [cart, isPizzaDiscountDay]);

  // Use the total from discountInfo for cartTotal
  const cartTotal = discountInfo.total;

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
      // Helper to compare toppings arrays
      const areToppingsEqual = (arr1: string[] | undefined, arr2: string[]) => {
        const t1 = arr1 || [];
        const t2 = arr2 || [];
        if (t1.length !== t2.length) return false;

        const sorted1 = [...t1].sort();
        const sorted2 = [...t2].sort();
        return sorted1.every((val, index) => val === sorted2[index]);
      };

      // Check if item already exists in cart
      const existingIndex = prev.findIndex(i => i.name === itemName && areToppingsEqual(i.toppings, safeToppings));

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

    // Determine the toppings for this operation
    let operationToppings: string[] = [];

    // 1. Priority: Direct toppings passed from the component
    if (directToppings && Array.isArray(directToppings)) {
      operationToppings = [...directToppings];
    }
    // 2. Predefined toppings for fixed items
    else if (item.predefinedToppings && Array.isArray(item.predefinedToppings)) {
      operationToppings = [...item.predefinedToppings];
    }
    // 3. Selected toppings from state for customizable items
    else if (item.name.includes("Toppings Pizza") && size) {
      const toppingKey = `${item.name}-${size}`;
      const toppingsFromState = selectedToppings[toppingKey];
      if (toppingsFromState && Array.isArray(toppingsFromState)) {
        operationToppings = [...toppingsFromState];
      }
    }

    setCart(prevCart => {
      const newCart = [...prevCart];
      const itemKey = size ? `${item.name} (${size})` : item.name;

      // Helper to compare toppings arrays
      const areToppingsEqual = (arr1: string[] | undefined, arr2: string[]) => {
        const t1 = arr1 || [];
        const t2 = arr2 || [];
        if (t1.length !== t2.length) return false;

        const sorted1 = [...t1].sort();
        const sorted2 = [...t2].sort();
        return sorted1.every((val, index) => val === sorted2[index]);
      };

      // Find item with same name AND same toppings
      const existingItemIndex = newCart.findIndex(i =>
        i.name === itemKey && areToppingsEqual(i.toppings, operationToppings)
      );

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
            // Ensure toppings are preserved
            toppings: operationToppings.length > 0 ? operationToppings : newCart[existingItemIndex].toppings
          };
        }
      } else if (delta > 0) {
        // Add new item to cart
        const newItem = {
          name: itemKey,
          quantity: delta,
          price: size ? Number(item.prices[size.toLowerCase()]) : Number(item.price),
          toppings: operationToppings,
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
          variant: "success",
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

        // Scroll to top before navigating
        window.scrollTo({ top: 0, behavior: 'smooth' });

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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <div className="shadow-lg">
      </div>
      {isPizzaDiscountDay && (
        <div className="bg-orange-600 text-white text-center py-2 px-4 shadow-md">
          <p className="text-xs sm:text-base font-medium">
            🍕 Limited Time Offer: 10% OFF All Pizzas (Monday-Friday Only!)
          </p>
        </div>
      )}
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-32 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 sm:gap-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading">Sandy's Market Menu</h1>
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
          discountInfo={discountInfo}
        />
      </main>
    </div>
  );
}
