import axios from "axios";
import { authReadyPromise } from "./authTracker";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://cavistalaptopmanagement.onrender.com";

export const apiClient = axios.create({ baseURL });

let accessTokenGetter: () => string | null = () => null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

apiClient.interceptors.request.use(async (config) => {
  await authReadyPromise;

  const token = accessTokenGetter();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
