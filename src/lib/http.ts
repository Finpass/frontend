import axios, { type AxiosRequestConfig } from "axios";
import type { ApiSuccess } from "@/types/api";
import { toApiError } from "@/lib/api-error";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
  timeout: 30_000,
  withCredentials: true,
});

let tokenGetter: () => string | null = () => null;

export const setAccessTokenGetter = (fn: () => string | null) => {
  tokenGetter = fn;
};

client.interceptors.request.use((config) => {
  const token = tokenGetter();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(toApiError(err)),
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await client.request<ApiSuccess<T>>(config);
  return res.data.data;
}

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PUT", url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "DELETE", url }),
};
