import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { ForgotPasswordPage } from "@/pages/public/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/public/ResetPasswordPage";
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { AccountsPage } from "@/pages/app/AccountsPage";
import { AccountDetailPage } from "@/pages/app/AccountDetailPage";
import { TransactionsPage } from "@/pages/app/TransactionsPage";
import { SendMoneyPage } from "@/pages/app/SendMoneyPage";
import { SystemInitialFundsPage } from "@/pages/app/SystemInitialFundsPage";
import { ROUTES } from "@/constants/routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={ROUTES.ACCOUNT_NEW} element={<Navigate to={ROUTES.ACCOUNTS} replace />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
          <Route path={ROUTES.ACCOUNT_DETAIL(":accountId")} element={<AccountDetailPage />} />
          <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
          <Route path={ROUTES.SEND_MONEY} element={<SendMoneyPage />} />
          <Route path={ROUTES.SYSTEM_INITIAL_FUNDS} element={<SystemInitialFundsPage />} />
        </Route>

        <Route element={<RootLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}