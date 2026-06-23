import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-biniq-navy via-biniq-navy to-purple-900">
      <div className="text-center">
        <div className="mb-8">
          <img
            src="https://cdn.builder.io/api/v1/assets/0b806350f02b4342b9c7f755ac336bc3/logo-f5188a?format=webp&width=800"
            alt="binIQ"
            className="w-16 h-16 mx-auto mb-4"
          />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-biniq-teal mb-2">Page not found</p>
        <p className="text-white/70 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-biniq-teal hover:bg-biniq-teal/90 text-white"
        >
          <Home className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
