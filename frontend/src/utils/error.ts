import type { AxiosError } from "axios";

export function extractErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (!error) return fallback;
  const ax = error as AxiosError<{ message?: string; status?: string }>;
  const data = ax?.response?.data;
  if (data?.message) return data.message;
  if (ax?.message) return ax.message;
  if (typeof error === "string") return error;
  return fallback;
}