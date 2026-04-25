import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { dismissToast, useToast } from "@/components/ui/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ResetPassword() {
  usePageTitle("Reset Password | Sandy's Market");
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    dismissToast();
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsCheckingToken(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/reset-password/${token}/validate`);
        const data = await response.json();
        setIsTokenValid(Boolean(response.ok && data.success));
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    void validateToken();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm password must match the new password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
        variant: "success",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
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
            <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600 text-sm">
              Choose a new password for your account.
            </p>
          </div>

          {isCheckingToken ? (
            <div className="text-sm text-gray-600">Validating reset link...</div>
          ) : !isTokenValid ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              This reset link is invalid or expired.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={20} />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={20} />
                  </div>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
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
