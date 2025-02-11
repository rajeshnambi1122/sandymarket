import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Pizza, Store, Clock, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const pizzaMenu = [
    {
      name: "Cheese Pizza",
      price: "$12.99",
      description: "Classic cheese blend",
    },
    {
      name: "Pepperoni Pizza",
      price: "$14.99",
      description: "Traditional pepperoni with cheese",
    },
    {
      name: "Supreme Pizza",
      price: "$16.99",
      description: "Loaded with veggies and meats",
    },
    {
      name: "BBQ Chicken",
      price: "$15.99",
      description: "Grilled chicken with BBQ sauce",
    },
    {
      name: "Veggie Delight",
      price: "$14.99",
      description: "Fresh garden vegetables",
    },
    {
      name: "Meat Lovers",
      price: "$17.99",
      description: "Packed with various meats",
    },
  ];

  const gasPrices = [
    { type: "Regular", price: "$3.29" },
    { type: "Mid-Grade", price: "$3.49" },
    { type: "Premium", price: "$3.69" },
    { type: "Diesel", price: "$3.89" },
  ];

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
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
                Sandy's Market
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Your one-stop destination for fuel, convenience, and delicious
                pizza
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Link to="/order-pizza">Order Pizza Online</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
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
                  <p className="text-gray-600">
                    Premium quality fuel at competitive prices
                  </p>
                  <img
                    src="/lovable-uploads/02cd446d-f09f-4647-88e4-e7b5508c6209.png"
                    alt="Pizza display"
                    className="mt-4 rounded-lg w-full h-48 object-cover"
                  />
                </div>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-up [animation-delay:200ms]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Convenience Store
                  </h3>
                  <p className="text-gray-600">
                    All your daily essentials in one place
                  </p>
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
                  <p className="text-gray-600">
                    Hot and delicious pizzas made to order
                  </p>
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

        {/* Pizza Menu Section */}
        <section className="py-16 bg-white" id="pizza-menu">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Our Pizza Menu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pizzaMenu.map((item, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow animate-fade-up"
                >
                  <div className="flex flex-col">
                    <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <p className="text-primary font-bold text-lg mt-auto">
                      {item.price}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => navigate("/order-pizza")}
              >
                Order Now
              </Button>
            </div>
          </div>
        </section>

        {/* Gas Prices Section */}
        <section className="py-16 bg-secondary/30" id="gas-prices">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Today's Gas Prices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {gasPrices.map((item, index) => (
                <Card
                  key={index}
                  className="p-6 text-center hover:shadow-lg transition-shadow animate-fade-up"
                >
                  <Fuel className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{item.type}</h3>
                  <p className="text-primary text-2xl font-bold">
                    {item.price}
                  </p>
                </Card>
              ))}
            </div>
            <p className="text-center mt-6 text-gray-600">
              Prices updated daily
            </p>
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
                  <p className="text-gray-600">
                    1057 Estey Road Beaverton, MI United States
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Hours</h3>
                  <p className="text-gray-600">Open 24/7</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Phone className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Contact</h3>
                  <p className="text-gray-600">+1 989-435-9688</p>
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
