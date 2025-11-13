import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Pizza, Store, Clock, MapPin, Phone, Star, ArrowRight, Truck, ChevronDown, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import gasPricesApi, { GasPrice } from "@/api/gasPrices";
import { useState, useEffect } from "react";

const Index = () => {
  const foodMenu = [
    {
      name: "Cheese Pizza",
      price: "$12.99",
      description: "Classic cheese blend",
      image: "/images/pizza1.jpg"
    },
    {
      name: "Pepperoni Pizza",
      price: "$14.99",
      description: "Traditional pepperoni with cheese",
      image: "/images/pizza2.jpg"
    },
    {
      name: "Supreme Pizza",
      price: "$16.99",
      description: "Loaded with veggies and meats",
      image: "/images/pizza3.jpg"
    },
    {
      name: "Fresh Subs",
      price: "$14.99",
      description: "Made with quality ingredients",
      image: "/images/subs.jpg"
    },
    {
      name: "Classic Burger",
      price: "$13.99",
      description: "Juicy and flavorful burger",
      image: "/images/burger.jpg"
    },
    {
      name: "French Fries",
      price: "$5.99",
      description: "Golden and crispy",
      image: "/images/frenchfries.jpg"
    },
  ];

  const [gasPrices, setGasPrices] = useState<GasPrice[]>([]);

  useEffect(() => {
    fetchGasPrices();
  }, []);

  const fetchGasPrices = async () => {
    try {
      const prices = await gasPricesApi.getGasPrices();

      setGasPrices(prices);
    } catch (error) {
      console.error("Failed to fetch gas prices:", error);
    }
  };

  const navigate = useNavigate();

  const scrollToGasPrices = () => {
    const gasPricesSection = document.getElementById('gas-prices');
    if (gasPricesSection) {
      gasPricesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/storeimage-1.png"
              alt="Gas station"
              className="w-full h-full object-cover scale-[1.02] motion-safe:animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
              style={{transformOrigin: 'center center'}}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/40" />
          </div>
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-3xl animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1 w-10 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full">
                  Welcome to Sandy's Market
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
                Fuel, Food, <span className="text-primary relative">Convenience
                  <span className="absolute -bottom-2 left-0 h-1 w-full bg-primary/50 rounded-full"></span>
                </span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl">
                Your one-stop destination for premium fuel, delicious food, and everyday essentials
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <Link to="/order" className="flex items-center gap-2">Order Food <ArrowRight size={18} /></Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white text-white hover:bg-white hover:text-primary rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={scrollToGasPrices}
                >
                  View Gas Prices
                </Button>
              </div>
            </div>
          </div>

        </section>

        {/* Why Choose Us Section */}
        <section className="bg-white pt-16 pb-20" id="why-choose-us">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-1 w-6 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full">Why Choose Us</span>
                <span className="h-1 w-6 bg-primary rounded-full"></span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Everything You Need in One Place</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">We offer premium fuel, fresh food, and daily essentials all under one roof for your convenience</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up overflow-hidden">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Fuel className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Premium Fuel</h3>
                  <p className="text-gray-600 mb-6">
                    Top-quality fuel at competitive prices to keep your vehicle running smoothly
                  </p>
                  <div className="relative overflow-hidden rounded-xl w-full h-48">
                    <img
                      src="/images/storeimage-1.png"
                      alt="Fuel station"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </Card>
              
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:200ms] overflow-hidden">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Store className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Market & Essentials
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Fresh groceries and everyday essentials for your convenience
                  </p>
                  <div className="relative overflow-hidden rounded-xl w-full h-48">
                    <img
                      src="/images/storeimage-3.png"
                      alt="Store interior"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </Card>
              
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:400ms] overflow-hidden">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Pizza className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Delicious Food</h3>
                  <p className="text-gray-600 mb-6">
                    Hot and fresh food made to order with premium ingredients
                  </p>
                  <div className="relative overflow-hidden rounded-xl w-full h-48">
                    <img
                      src="/images/storeimage-2.png"
                      alt="Food"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Food Menu Section */}
        <section className="py-20 bg-gray-50" id="food-menu">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-1 w-6 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full">Our Menu</span>
                <span className="h-1 w-6 bg-primary rounded-full"></span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Fresh & Delicious Food</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Enjoy our variety of freshly made pizzas, subs, burgers and more - all made with quality ingredients</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {foodMenu.map((item, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 w-full overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold mb-1 text-white">{item.name}</h3>
                        <p className="text-white/80 text-sm mb-2">{item.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="bg-primary text-white font-bold rounded-full px-3 py-1 text-sm shadow-lg">
                            {item.price}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-white text-white bg-primary/80 hover:bg-white hover:text-primary transition-colors"
                            onClick={() => navigate("/order")}
                          >
                            <span className="flex items-center gap-1">
                              Order
                              <ArrowRight size={14} />
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-16">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => navigate("/order")}
              >
                <span className="flex items-center gap-2">
                  View Full Menu
                  <ArrowRight size={18} />
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* Gas Prices Section */}
        <section id="gas-prices" className="py-20 bg-white relative">
          <div className="absolute inset-0 bg-[url('/images/02cd446d-f09f-4647-88e4-e7b5508c6209.png')] bg-cover bg-center opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-1 w-6 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full">Fuel Prices</span>
                <span className="h-1 w-6 bg-primary rounded-full"></span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Today's Gas Prices</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">We offer quality fuel at competitive prices</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {gasPrices.map((item, index) => (
                <Card
                  key={index}
                  className="group p-8 text-center rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Fuel className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.type}</h3>
                  <p className="text-primary text-3xl font-bold group-hover:scale-110 transition-transform duration-300">{item.price}</p>
                  <p className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Updated today</p>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-gray-600 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" /> Prices are updated daily
            </p>
          </div>
        </section>

        {/* Testimonials Section - COMMENTED OUT AS REQUESTED
        <section className="py-20 bg-gray-50 relative overflow-hidden">
          <div className="absolute top-0 right-0">
            <div className="w-64 h-64 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2"></div>
          </div>
          <div className="absolute bottom-0 left-0">
            <div className="w-64 h-64 rounded-full bg-primary/5 translate-y-1/2 -translate-x-1/2"></div>
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-1 w-6 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full">Testimonials</span>
                <span className="h-1 w-6 bg-primary rounded-full"></span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">See why our customers love visiting Sandy's Market</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="flex flex-col">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                    The pizza here is amazing! Fresh ingredients and the staff is always friendly. My go-to spot when I need to fill up and grab a quick bite.
                    <span className="absolute -bottom-4 -right-2 text-6xl text-primary/10 font-serif">"</span>
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-700 font-semibold">
                      JD
                    </div>
                    <div>
                      <p className="font-semibold">John D.</p>
                      <p className="text-sm text-gray-500">Regular Customer</p>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:200ms] relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="flex flex-col">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                    Great fuel prices and the convenience store has everything I need. The Supreme Pizza is a must-try - best in town!
                    <span className="absolute -bottom-4 -right-2 text-6xl text-primary/10 font-serif">"</span>
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-700 font-semibold">
                      SM
                    </div>
                    <div>
                      <p className="font-semibold">Sarah M.</p>
                      <p className="text-sm text-gray-500">Local Resident</p>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:400ms] relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="flex flex-col">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                    Clean station, competitive gas prices, and the BBQ Chicken pizza is outstanding! Sandy's Market has been my go-to for years.
                    <span className="absolute -bottom-4 -right-2 text-6xl text-primary/10 font-serif">"</span>
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-700 font-semibold">
                      MT
                    </div>
                    <div>
                      <p className="font-semibold">Michael T.</p>
                      <p className="text-sm text-gray-500">Loyal Customer</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
        */}

        {/* Contact & Info Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/ce094248-3f2d-4835-9b7c-6f2dc995f3ae.png')] bg-cover bg-center opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-1 w-6 bg-primary rounded-full"></span>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full">Visit Us</span>
                <span className="h-1 w-6 bg-primary rounded-full"></span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Come See Us Today</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">We're conveniently located and ready to serve you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <MapPin className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Our Location</h3>
                  <p className="text-gray-600 mb-6">
                    1057 Estey Road<br />
                    Beaverton, MI<br />
                    United States
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-auto border-primary text-primary hover:bg-primary hover:text-white transition-colors group-hover:bg-primary group-hover:text-white"
                    onClick={() => window.open("https://maps.google.com/?q=1057+Estey+Road+Beaverton+MI", "_blank")}
                  >
                    <span className="flex items-center gap-2">
                      Get Directions
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </Card>
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:200ms] relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Clock className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Hours</h3>
                  <div className="w-full">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Monday - Sunday:</span>
                      <span className="text-primary font-medium">24 Hours</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Every Day:</span>
                      <span className="text-primary font-medium">Open 24/7</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="group p-8 rounded-xl hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-2 animate-fade-up [animation-delay:400ms] relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Phone className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Contact</h3>
                  <div className="flex items-center justify-center mb-2 text-gray-600">
                    <div className="w-4 h-4 flex items-center justify-center mr-2">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <span>+1 989-435-9688</span>
                  </div>
                  <div className="flex items-center justify-center mb-6 text-gray-600 whitespace-nowrap">
                    <div className="w-4 h-4 flex items-center justify-center mr-2">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-gray-600 whitespace-nowrap">sandysmarket-gbs@hotmail.com</span>
                  </div>
                  <Button 
                    className="mt-auto bg-primary hover:bg-primary/90 text-white transition-colors hover:scale-105 transform duration-300"
                    onClick={() => window.open("tel:+19894359688")}
                  >
                    <span className="flex items-center gap-2">
                      Call Now
                      <Phone size={16} />
                    </span>
                  </Button>                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 opacity-10">
              <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFFFFF" d="M38.7,-65.7C52.9,-60.3,69.3,-54.5,72.9,-42.8C76.5,-31.1,67.1,-13.5,63.4,3.1C59.7,19.7,61.6,35.3,55.3,45.9C49,56.5,34.6,62.1,20.1,67.1C5.6,72,-9,76.3,-21.6,72.9C-34.3,69.6,-45.1,58.6,-51.7,46.2C-58.3,33.8,-60.8,19.9,-65.1,4.3C-69.4,-11.4,-75.4,-28.8,-71.5,-44.1C-67.7,-59.4,-53.9,-72.6,-38.5,-77.4C-23,-82.2,-5.8,-78.6,6.9,-70.5C19.7,-62.4,24.6,-71.1,38.7,-65.7Z" transform="translate(100 100)" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 opacity-10">
              <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFFFFF" d="M21.3,-33.4C29.9,-26.9,40.7,-24.2,46.5,-17.4C52.4,-10.5,53.2,0.5,47.8,7.2C42.3,14,30.7,16.4,22.2,23.9C13.8,31.4,8.5,43.9,-0.2,44.2C-8.9,44.5,-21.2,32.5,-27.1,22.5C-33,12.5,-32.5,4.4,-31.8,-3.9C-31.1,-12.3,-30.2,-21,-25.7,-28.5C-21.2,-36,-13,-42.2,-4.3,-42.3C4.4,-42.3,12.7,-39.9,21.3,-33.4Z" transform="translate(100 100)" />
              </svg>
            </div>
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-white">
              <div className="md:max-w-md">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Order?</h2>
                <p className="text-white/90 text-lg mb-4">Fresh, delicious pizza is just a click away!</p>
                <div className="flex gap-4 items-center">
                  <div className="flex -space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center z-30">
                      <Pizza className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center z-20">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center z-10">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <span className="text-sm text-white/80">Enjoyed by hundreds of customers</span>
                </div>
              </div>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => navigate("/order")}
              >
                <span className="flex items-center gap-2">
                  Order Now
                  <ArrowRight size={18} />
                </span>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
