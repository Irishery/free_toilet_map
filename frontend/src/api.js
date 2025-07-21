// src/api.js
import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
