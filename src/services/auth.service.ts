import api from "../lib/axios";
import type { ApiResponse } from "../types/api_response";
import type { LoginData } from "../types/models/user";

export const authService = {
  login: async (email: string, pass: string) => {
    const response = await api.post<ApiResponse<LoginData>>("/auth/login", {
      email,
      password: pass,
    });
    return response.data;
  },
};
