import React, { useState } from 'react';

const OrderForm: React.FC = () => {
  const [smsConsent, setSmsConsent] = useState(false);

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
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">Order Details</label>
        <textarea id="order" name="order" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required></textarea>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="smsConsent"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          style={{ display: 'block' }}
        />
        <label htmlFor="smsConsent" className="ml-2 block text-sm text-gray-700">
          I agree to receive SMS updates about my order.
        </label>
      </div>
      <p className="text-sm text-gray-500">
        By placing this order, you consent to receive SMS notifications regarding your order status. Msg & Data rates may apply.
      </p>
      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Place Order
      </button>
    </form>
  );
};

export default OrderForm; 