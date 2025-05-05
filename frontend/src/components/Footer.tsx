import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-400">
              Your one-stop destination for quality fuel, convenience items, and
              delicious pizza.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <p className="text-gray-400">1057 Estey Road</p>
            <p className="text-gray-400">Beaverton, MI</p>
            <p className="text-gray-400">United States</p>
            <p className="text-gray-400 mt-2">Phone: +1 989-435-9688</p>
            <p className="text-gray-400">Email: sandysmarket19@gmail.com</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Hours</h3>
            <div className="text-gray-400 space-y-1">
              <p>Monday-Thursday: 6 am – 10 pm</p>
              <p>Friday: 6 am – 11 pm</p>
              <p>Saturday: 7 am – 11 pm</p>
              <p>Sunday: 7 am – 10 pm</p>
            </div>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://www.facebook.com/sandysmarket2020"
                className="text-gray-400 hover:text-primary"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="mailto:sandysmarket19@gmail.com"
                className="text-gray-400 hover:text-primary"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        <Link to="/privacy-policy" className="text-gray-400  hover:underline">
          Privacy Policy
        </Link>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>Sandy's Market</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
