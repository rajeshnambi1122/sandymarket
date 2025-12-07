import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Pizza, Store, Clock, MapPin, Phone, Star, ArrowRight, Truck, ChevronDown, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import gasPricesApi from "@/api/gasPrices";
import { GasPrice } from "@/types/index";
import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

const Index = () => {
  usePageTitle("Sandy's Market | Fuel, Food & Convenience");
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
          <div className="absolute inset-0 z-0">
            <picture>
              <source srcSet="/images/storeimage-1.webp" type="image/webp" />
              <img
                src="/images/storeimage-1.png"
                alt="Gas station"
                width="1920"
                height="1080"
                className="w-full h-full object-cover scale-[1.02] motion-safe:animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
                style={{ transformOrigin: 'center center' }}
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          </div>
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-4xl animate-fade-up">
              <div className="flex items-center gap-3 mb-6 animate-bounce-slow">
                <span className="h-1 w-12 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                <span className="inline-block px-5 py-2 text-xs font-bold bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-orange-400 rounded-full tracking-wide uppercase shadow-lg">
                  Welcome to Sandy's Market
                </span>
              </div>
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold font-heading mb-8 text-white leading-tight drop-shadow-xl">
                Fuel, Food, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 relative">
                  Convenience
                  <svg className="absolute -bottom-4 left-0 w-full h-3 text-orange-500 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 L 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl leading-relaxed font-light">
                Your premium one-stop destination for quality fuel, fresh delicious food, and all your everyday essentials.
              </p>
              <div className="flex flex-wrap gap-5">
                <Button
                  asChild
                  size="sm"
                  className="bg-primary2 hover:bg-orange-700 text-white rounded-full px-10 py-7 text-lg font-bold shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] hover:-translate-y-1 transition-all duration-300 border border-orange-500/50"
                >
                  <Link to="/order" className="flex items-center gap-3" aria-label="Order Food">
                    Order Food <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-orange-600 rounded-full px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={scrollToGasPrices}
                >
                  View Gas Prices
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-white pt-24 pb-24 relative" id="why-choose-us">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-50"></div>
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
                <span className="inline-block px-6 py-2 text-sm font-bold bg-orange-50 text-orange-600 rounded-full border border-orange-100 uppercase tracking-wider">Why Choose Us</span>
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-gray-900">Everything You Need in One Place</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">We offer premium fuel, fresh food, and daily essentials all under one roof for your ultimate convenience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:rotate-3">
                    <Fuel className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800 group-hover:text-orange-600 transition-colors">Premium Fuel</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                    Top-quality fuel at competitive prices to keep your vehicle running smoothly on every journey.
                  </p>
                  <div className="relative overflow-hidden rounded-2xl w-full h-56 shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <picture>
                      <source srcSet="/images/storeimage-1.webp" type="image/webp" />
                      <img
                        src="/images/storeimage-1.png"
                        alt="Fuel station"
                        width="560"
                        height="224"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                </div>
              </Card>

              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up delay-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:-rotate-3">
                    <Pizza className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800 group-hover:text-orange-600 transition-colors">Fresh Food</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                    Delicious pizzas, subs, and snacks prepared fresh daily in our kitchen with premium ingredients.
                  </p>
                  <div className="relative overflow-hidden rounded-2xl w-full h-56 shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <picture>
                      <source srcSet="/images/storeimage-3.webp" type="image/webp" />
                      <img
                        src="/images/storeimage-3.png"
                        alt="Store interior"
                        width="560"
                        height="224"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                </div>
              </Card>

              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up delay-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:rotate-3">
                    <Store className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800 group-hover:text-orange-600 transition-colors">Convenience</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                    Wide selection of snacks, beverages, and daily essentials for your journey, available 24/7.
                  </p>
                  <div className="relative overflow-hidden rounded-2xl w-full h-56 shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <picture>
                      <source srcSet="/images/storeimage-2.webp" type="image/webp" />
                      <img
                        src="/images/storeimage-2.png"
                        alt="Food"
                        width="560"
                        height="224"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Food Menu Section */}
        <section className="py-24 bg-gray-50" id="food-menu">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
                <span className="inline-block px-6 py-2 text-sm font-bold bg-orange-100 text-orange-600 rounded-full border border-orange-200 uppercase tracking-wider">Our Menu</span>
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-gray-900">Fresh & Delicious Food</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">Enjoy our variety of freshly made pizzas, subs, burgers and more - all made with quality ingredients.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {foodMenu.map((item, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden rounded-[1.5rem] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-500 border-none bg-white shadow-lg hover:-translate-y-2 animate-fade-up relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {index === 0 && (
                    <div className="absolute top-4 right-4 z-20 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      POPULAR
                    </div>
                  )}
                  <div className="relative h-72 w-full overflow-hidden">
                    <picture>
                      <source srcSet={item.image.replace(/\.(jpg|png)$/i, '.webp')} type="image/webp" />
                      <img
                        src={item.image}
                        alt={item.name}
                        width="400"
                        height="288"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-2xl font-bold mb-2 text-white font-heading tracking-wide">{item.name}</h3>
                        <p className="text-gray-200 text-sm mb-4 line-clamp-2 opacity-90">{item.description}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-2xl font-bold text-orange-400 drop-shadow-sm">
                            {item.price}
                          </span>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-white text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-full px-5 font-bold shadow-lg"
                    onClick={() => navigate("/order")}
                    aria-label={`Order ${item.name}`}
                  >
                            <span className="flex items-center gap-2">
                              Order
                              <ArrowRight size={16} aria-hidden="true" />
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-20">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-orange-500"
                onClick={() => navigate("/order")}
              >
                <span className="flex items-center gap-3">
                  View Full Menu
                  <ArrowRight size={20} aria-hidden="true" />
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* Gas Prices Section */}
        <section id="gas-prices" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900">
            <div className="absolute inset-0 bg-[url('/images/02cd446d-f09f-4647-88e4-e7b5508c6209.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-1 w-8 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                <span className="inline-block px-6 py-2 text-sm font-bold bg-white/10 text-orange-400 rounded-full border border-white/20 backdrop-blur-md uppercase tracking-wider">Fuel Prices</span>
                <span className="h-1 w-8 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-white">Today's Gas Prices</h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light">We offer quality fuel at competitive prices, updated daily for your convenience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {gasPrices.map((item, index) => (
                <Card
                  key={index}
                  className="group p-6 text-center rounded-2xl hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500 border border-white/10 bg-white/5 backdrop-blur-md hover:-translate-y-2 animate-fade-up overflow-hidden relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-lg group-hover:shadow-orange-500/50 group-hover:scale-110">
                    <Fuel className="w-8 h-8 text-orange-400 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white tracking-wide">{item.type}</h3>
                  <div className="relative inline-block">
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 group-hover:from-orange-400 group-hover:to-orange-200 transition-all duration-500 font-mono tracking-tighter">
                      {item.price}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs text-gray-200">Live Price</p>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-center mt-12 text-gray-300 flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" aria-hidden="true" /> Prices are subject to change without notice
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
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/ce094248-3f2d-4835-9b7c-6f2dc995f3ae.png')] bg-cover bg-center opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-50/50 to-transparent"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
                <span className="inline-block px-6 py-2 text-sm font-bold bg-orange-100 text-orange-600 rounded-full border border-orange-200 uppercase tracking-wider">Visit Us</span>
                <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-gray-900">Come See Us Today</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">We're conveniently located and ready to serve you with a smile, 24 hours a day.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10 h-full">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:rotate-3">
                    <MapPin className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800">Our Location</h3>
                  <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                    1057 Estey Road<br />
                    Beaverton, MI<br />
                    United States
                  </p>
                  <Button
                    variant="outline"
                    className="mt-auto w-full border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 rounded-xl py-6 font-bold"
                    onClick={() => window.open("https://maps.google.com/?q=1057+Estey+Road+Beaverton+MI", "_blank")}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Get Directions
                      <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    </span>
                  </Button>
                </div>
              </Card>

              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up delay-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10 h-full">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:-rotate-3">
                    <Clock className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800">Hours</h3>
                  <div className="w-full mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Monday - Sunday</span>
                      <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg">24 Hours</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-500 font-medium">Every Day</span>
                      <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg">Open 24/7</span>
                    </div>
                  </div>
                  <div className="mt-auto w-full p-4 bg-green-50 rounded-xl border border-green-100 text-green-700 font-bold flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Open Now
                  </div>
                </div>
              </Card>

              <Card className="group p-8 rounded-[2rem] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 bg-white hover:-translate-y-2 animate-fade-up delay-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10 h-full">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:rotate-3">
                    <Phone className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-4 text-gray-800">Contact</h3>
                  <div className="flex flex-col gap-3 mb-8 w-full">
                    <a href="tel:+19894359688" className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors group/link" aria-label="Call Sandy's Market">
                      <Phone className="w-5 h-5 text-gray-400 group-hover/link:text-orange-500 transition-colors" aria-hidden="true" />
                      <span className="text-gray-700 font-bold group-hover/link:text-orange-700 transition-colors">+1 989-435-9688</span>
                    </a>
                    <a href="mailto:sandysmarket-gbs@hotmail.com" className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors group/link" aria-label="Email Sandy's Market">
                      <Mail className="w-5 h-5 text-gray-400 group-hover/link:text-orange-500 transition-colors" aria-hidden="true" />
                      <span className="text-gray-700 font-medium text-sm group-hover/link:text-orange-700 transition-colors truncate">sandysmarket-gbs@hotmail.com</span>
                    </a>
                  </div>
                  <Button
                    className="mt-auto w-full bg-orange-600 hover:bg-orange-700 text-white transition-all hover:scale-105 transform duration-300 rounded-xl py-6 font-bold shadow-lg hover:shadow-orange-500/30"
                    onClick={() => window.open("tel:+19894359688")}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Call Now
                      <Phone size={18} aria-hidden="true" />
                    </span>
                  </Button>
                </div>
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
                <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Ready to Order?</h2>
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
                  <ArrowRight size={18} aria-hidden="true" />
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
