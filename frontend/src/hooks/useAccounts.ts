import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as accountsApi from "@/api/accounts";
import * as transactionsApi from "@/api/transactions";
import * as authApi from "@/api/auth";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { extractErrorMessage } from "@/utils/error";
import { useToast } from "@/hooks/useToast";

export function useAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: accountsApi.listAccounts,
  });
}

export function useAccountBalance(accountId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.accountBalance(accountId ?? ""),
    queryFn: () => accountsApi.getAccountBalance(accountId as string),
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      push({ kind: "success", message: "Account created" });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: transactionsApi.createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      push({ kind: "success", message: "Transaction completed" });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useCreateInitialFunds() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: transactionsApi.createInitialFunds,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      push({ kind: "success", message: "Initial funds sent" });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useLogin() {
  const { setSession } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data.user, data.token);
      push({ kind: "success", message: `Welcome, ${data.user.name}` });
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useRegister() {
  const { setSession } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data.user, data.token);
      push({ kind: "success", message: "Account created" });
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useLogout() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession();
      qc.clear();
      navigate(ROUTES.LOGIN, { replace: true });
      push({ kind: "success", message: "Signed out" });
    },
  });
}

export function useForgotPassword() {
  const { push } = useToast();
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data) => push({ kind: "success", message: data.message }),
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}

export function useResetPassword() {
  const { push } = useToast();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      push({ kind: "success", message: data.message });
      navigate(ROUTES.LOGIN, { replace: true });
    },
    onError: (err) =>
      push({ kind: "error", message: extractErrorMessage(err) }),
  });
}