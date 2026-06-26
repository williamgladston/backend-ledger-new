import { Navigate } from "react-router-dom";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <LoginForm />;
}