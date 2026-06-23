import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/AdvancedDashboard";
import Scans from "./pages/Scans";
import StoreOwners from "./pages/StoreOwnersEnhanced";
import Resellers from "./pages/ResellersEnhanced";
import Subscriptions from "./pages/Subscriptions";
import Locations from "./pages/LocationsEnhanced";
import Feedback from "./pages/FeedbackEnhanced";
import FAQ from "./pages/FAQ";
import Settings from "./pages/Settings";
import InitialQuestions from "./pages/InitialQuestions";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Marketing from "./pages/Marketing";
import AdminClaims from "./pages/Adminclaims";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scans"
                element={
                  <ProtectedRoute>
                    <Scans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store-owners"
                element={
                  <ProtectedRoute>
                    <StoreOwners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store-claims"
                element={
                  <ProtectedRoute>
                    <AdminClaims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resellers"
                element={
                  <ProtectedRoute>
                    <Resellers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute>
                    <Subscriptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations"
                element={
                  <ProtectedRoute>
                    <Locations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faq"
                element={
                  <ProtectedRoute>
                    <FAQ />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/initial-questions"
                element={
                  <ProtectedRoute>
                    <InitialQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing"
                element={
                  <ProtectedRoute>
                    <Marketing />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}