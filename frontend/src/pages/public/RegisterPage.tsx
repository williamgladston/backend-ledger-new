import { Navigate } from "react-router-dom";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export function RegisterPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <RegisterForm />;
}