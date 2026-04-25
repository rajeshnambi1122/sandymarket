import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AdminRoute } from "./components/AdminRoute";

// Lazy load routes for better code splitting
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));



// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

const PasswordResetRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get("reset-password-token");

    if (!token) {
      return;
    }

    navigate(`/reset-password/${encodeURIComponent(token)}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <PasswordResetRedirect />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Admin />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPassword />
            </Suspense>
          }
        />
        <Route
          path="/order"
          element={
            <Suspense fallback={<PageLoader />}>
              <OrderPage />
            </Suspense>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <OrderSuccess />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
