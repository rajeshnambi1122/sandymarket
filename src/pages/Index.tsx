
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Pizza, Store, Clock, MapPin, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-16">
          <div className="absolute inset-0">
            <img
              src="/lovable-uploads/02cd446d-f09f-4647-88e4-e7b5508c6209.png"
              alt="Gas station"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-20">
            <div className="text-center animate-fade-up">
              <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-primary/10 text-white rounded-full">
                Welcome to
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                Gas N' Grab Pizza Stop
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Your one-stop destination for fuel, convenience, and delicious pizza
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                  Order Pizza Online
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  View Gas Prices
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Fuel className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality Fuel</h3>
                  <p className="text-gray-600">Premium quality fuel at competitive prices</p>
                </div>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up [animation-delay:200ms]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Convenience Store</h3>
                  <p className="text-gray-600">All your daily essentials in one place</p>
                  <img
                    src="/lovable-uploads/ce094248-3f2d-4835-9b7c-6f2dc995f3ae.png"
                    alt="Store interior"
                    className="mt-4 rounded-lg w-full h-48 object-cover"
                  />
                </div>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up [animation-delay:400ms]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Pizza className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Fresh Pizza</h3>
                  <p className="text-gray-600">Hot and delicious pizzas made to order</p>
                  <img
                    src="/lovable-uploads/cab21a61-1ae6-4a16-b9a3-9d8d7b4a065d.png"
                    alt="Pizza display"
                    className="mt-4 rounded-lg w-full h-48 object-cover"
                  />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Visit Us Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <MapPin className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Location</h3>
                  <p className="text-gray-600">123 Main Street, City, State</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Hours</h3>
                  <p className="text-gray-600">Open 24/7</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Phone className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Contact</h3>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
