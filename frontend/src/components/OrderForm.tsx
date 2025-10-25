import React, { useState } from 'react';

const OrderForm: React.FC = () => {
  const [smsConsent, setSmsConsent] = useState(false);
  const [pizzaSize, setPizzaSize] = useState('medium');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState('pickup');


  const toppings = [
    'Pepperoni',
    'Mushrooms',
    'Onions',
    'Green Peppers',
    'Black Olives',
    'Pineapple',
    'Extra Cheese',
    'Sausage',
    'Bacon',
    'Ham'
  ];

  const handleToppingChange = (topping: string) => {
    setSelectedToppings(prev => 
      prev.includes(topping)
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle order submission logic here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" id="name" name="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input type="tel" id="phone" name="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="pickup"
              name="deliveryType"
              value="pickup"
              checked={deliveryType === 'pickup'}
              onChange={() => setDeliveryType('pickup')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor="pickup" className="ml-2 block text-sm text-gray-700">
              Pickup
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="door-delivery"
              name="deliveryType"
              value="door-delivery"
              checked={deliveryType === 'door-delivery'}
              onChange={() => setDeliveryType('door-delivery')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor="door-delivery" className="ml-2 block text-sm text-gray-700">
              Door Delivery
            </label>
          </div>
        </div>
      </div>

      {deliveryType === 'door-delivery' && (
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Delivery Address</label>
          <textarea 
            id="address" 
            name="address" 
            rows={2} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your delivery address..."
            required
          ></textarea>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pizza Size</label>
        <div className="grid grid-cols-3 gap-4">
          {['small', 'medium', 'large'].map((size) => (
            <div key={size} className="flex items-center">
              <input
                type="radio"
                id={size}
                name="size"
                value={size}
                checked={pizzaSize === size}
                onChange={() => setPizzaSize(size)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor={size} className="ml-2 block text-sm text-gray-700 capitalize">
                {size}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Toppings</label>
        <div className="grid grid-cols-2 gap-2">
          {toppings.map((topping) => (
            <div key={topping} className="flex items-center">
              <input
                type="checkbox"
                id={topping}
                checked={selectedToppings.includes(topping)}
                onChange={() => handleToppingChange(topping)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={topping} className="ml-2 block text-sm text-gray-700">
                {topping}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">Special Instructions</label>
        <textarea 
          id="specialInstructions" 
          name="specialInstructions" 
          rows={2} 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Any special requests or instructions..."
        ></textarea>
      </div>

      <div className="flex items-center">
        <input
          type="radio"
          id="smsConsent"
          name="smsConsent"
          value="yes"
          checked={smsConsent}
          onChange={() => setSmsConsent(true)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="smsConsent" className="ml-2 block text-sm text-gray-700">
          I agree to receive SMS updates about my order.
        </label>
      </div>



      <p className="text-sm text-gray-500">
        By placing this order, you consent to receive SMS notifications regarding your order status. Msg & Data rates may apply.
      </p>
      <button 
        type="submit" 
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Place Order
      </button>
    </form>
  );
};

export default OrderForm; 