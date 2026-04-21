import api from "../lib/axios";
import type { ApiResponse } from "../types/api_response";
import type { PaginatedData } from "../types/models/attendance";
import type { User, UserFilterParams } from "../types/models/user";

export const userService = {
  getUsers: async (params: UserFilterParams) => {
    const { data } = await api.get<ApiResponse<PaginatedData<User>>>("/users", {
      params,
    });
    return data.data;
  },

  updateUser: async (
    id: string,
    payload: Partial<User> & { password?: string },
  ) => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/users/${id}`,
      payload,
    );
    return data;
  },
};
