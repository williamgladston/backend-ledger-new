import { apiClient } from "./client";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types/user";

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login", payload);
  return data;
}

export async function logout(): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/api/auth/logout");
  return data;
}

export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/forgot-password",
    payload,
  );
  return data;
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/reset-password",
    payload,
  );
  return data;
}