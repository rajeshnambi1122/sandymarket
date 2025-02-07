
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GasPump, Pizza, Store, Clock, MapPin, Phone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10" />
        <div className="container mx-auto px-4 relative z-20">
          <div className="text-center animate-fade-up">
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-primary/10 text-primary rounded-full">
              Welcome to
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Gas N' Grab Pizza Stop
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your one-stop destination for fuel, convenience, and delicious pizza
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Order Pizza Online
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
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
                  <GasPump className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Fuel</h3>
                <p className="text-gray-600">
                  Premium quality fuel at competitive prices
                </p>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up [animation-delay:200ms]">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Convenience Store</h3>
                <p className="text-gray-600">
                  All your daily essentials in one place
                </p>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up [animation-delay:400ms]">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Pizza className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fresh Pizza</h3>
                <p className="text-gray-600">
                  Hot and delicious pizzas made to order
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Visit Us Today
            </h2>
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
    </div>
  );
};

export default Index;
