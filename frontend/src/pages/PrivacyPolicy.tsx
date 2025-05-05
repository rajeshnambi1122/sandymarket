import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="px-4 md:px-20 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">Privacy Policy</h1>
        <section className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700">Data Collection Practices</h2>
          <p className="text-gray-600">We collect information that you provide directly to us, such as your name, email address, and phone number, to process your orders and improve your experience.</p>
        </section>
        <section className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700">Messaging Purpose</h2>
          <p className="text-gray-600">We use your contact information to send you updates regarding your order status and other relevant communications.</p>
        </section>
        <section className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700">SMS Consent Terms</h2>
          <p className="text-gray-600">By providing your phone number, you consent to receive SMS notifications about your order status. Message and data rates may apply.</p>
        </section>
        <section className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700">Opt-Out Instructions</h2>
          <p className="text-gray-600">To opt out of SMS notifications, please contact our support team or follow the instructions provided in the messages.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 