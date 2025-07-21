import { createThrowingClient } from "@erp-system/sdk";

export const apiClient = createThrowingClient({
  baseUrl: "/api",
  headers: {
    "X-Api-Version": "1.0.0",
  },
  credentials: "include",
});
