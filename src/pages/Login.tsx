import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      let errorMessage =
        "Login failed. Please check your credentials and try again.";

      if (err instanceof Error) {
        if (err.message.includes("Unable to connect")) {
          errorMessage =
            "Unable to connect to server. Using demo mode with credentials: admin@binIQ.com / Admin@123";
        } else if (err.message.includes("Invalid credentials")) {
          errorMessage =
            "Invalid credentials. Use admin@binIQ.com / Admin@123 for demo.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-biniq-navy via-biniq-navy to-purple-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://cdn.builder.io/api/v1/assets/0b806350f02b4342b9c7f755ac336bc3/logo-f5188a?format=webp&width=800"
            alt="binIQ Logo"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">binIQ Admin</h1>
          <p className="text-biniq-teal">Sign in to your admin dashboard</p>
        </div>

        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-biniq-navy">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-biniq-gray">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-biniq-navy font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@binIQ.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-biniq-teal focus:ring-biniq-teal disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-biniq-navy font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10 border-gray-300 focus:border-biniq-teal focus:ring-biniq-teal disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-biniq-gray hover:text-biniq-navy"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-biniq-teal hover:bg-biniq-teal/90 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-6 space-y-3">
              <div className="p-3 bg-biniq-teal/10 border border-biniq-teal/20 rounded-lg">
                <p className="text-xs font-medium text-biniq-navy mb-1">
                  Demo Credentials:
                </p>
                <p className="text-xs text-biniq-gray">
                  Email: admin@binIQ.com
                </p>
                <p className="text-xs text-biniq-gray">Password: Admin@123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-white/70 text-sm">
          © 2024 binIQ. All rights reserved.
        </div>
      </div>
    </div>
  );
}
