import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="  bg-slate-900  text-white">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-300">
              Your one-stop destination for quality fuel, convenience items, and
              delicious pizza.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <p className="text-gray-300">1057 Estey Road</p>
            <p className="text-gray-300">Beaverton, MI</p>
            <p className="text-gray-300">United States</p>
            <p className="text-gray-300 mt-2">Phone: +1 989-435-9688</p>
            <p className="text-gray-300">Email: sandysmarket-gbs@hotmail.com</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Hours</h3>
            <div className="text-gray-300 space-y-1">
              <p>Monday - Sunday: 24 Hours</p>
              <p>Open 24/7</p>
            </div>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://www.facebook.com/sandysmarket2020"
                className="text-gray-300 hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Sandy's Market on Facebook"
              >
                <Facebook className="w-6 h-6" aria-hidden="true" />
              </a>
              <a
                href="mailto:sandysmarket19@gmail.com"
                className="text-gray-300 hover:text-primary transition-colors"
                aria-label="Email Sandy's Market"
              >
                <Mail className="w-6 h-6" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
          <p>💖Sandy's Market</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
