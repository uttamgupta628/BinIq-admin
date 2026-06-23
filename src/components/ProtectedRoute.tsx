import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-biniq-navy via-biniq-navy to-purple-900">
        <div className="text-center">
          <img
            src="https://cdn.builder.io/api/v1/assets/0b806350f02b4342b9c7f755ac336bc3/logo-f5188a?format=webp&width=800"
            alt="binIQ"
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <div className="w-8 h-8 border-4 border-biniq-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
