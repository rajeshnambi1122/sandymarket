import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const OrderPage = lazy(() => import("./pages/OrderPage"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
