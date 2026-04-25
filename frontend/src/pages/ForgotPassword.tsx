import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { dismissToast, useToast } from "@/components/ui/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ForgotPassword() {
  usePageTitle("Forgot Password | Sandy's Market");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Clear stale auth toasts when arriving from another auth screen.
    dismissToast();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setIsSubmitted(true);
      toast({
        title: "Reset link requested",
        description: "If the email exists, a reset link has been sent.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md p-8 md:p-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl my-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">Forgot Password</h1>
            <p className="text-gray-600 text-sm">
              Enter your email to receive a password reset link.
            </p>
          </div>

          {isSubmitted ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-gray-700">
              If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={20} />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
