
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-400">
              Your one-stop destination for quality fuel, convenience items, and delicious pizza.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-primary">
                  Pizza Menu
                </Link>
              </li>
              <li>
                <Link to="/store" className="text-gray-400 hover:text-primary">
                  Store Items
                </Link>
              </li>
              <li>
                <Link to="/gas" className="text-gray-400 hover:text-primary">
                  Gas Prices
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Hours</h3>
            <p className="text-gray-400">Open 24/7</p>
            <p className="text-gray-400">365 days a year</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact & Follow</h3>
            <p className="text-gray-400 mb-4">(555) 123-4567</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Gas N' Grab Pizza Stop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
