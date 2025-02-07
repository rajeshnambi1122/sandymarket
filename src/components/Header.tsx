import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-primary">
            Sandy's Market
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary">
              Home
            </Link>
            <Link to="/menu" className="text-gray-600 hover:text-primary">
              Pizza Menu
            </Link>
            <Link to="/store" className="text-gray-600 hover:text-primary">
              Store
            </Link>
            <Link to="/gas" className="text-gray-600 hover:text-primary">
              Gas Prices
            </Link>
          </nav>
          <Button className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden md:inline">+1 989-435-9688</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
