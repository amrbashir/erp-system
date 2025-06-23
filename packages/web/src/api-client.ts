import { createClient, createClient2 } from "@tech-zone-store/sdk";
import { getStoredUser, setStoredUser } from "./auth";

enum StatusCode {
  Unauthorized = 401,
}

const clientOptions = {
  baseUrl: "/api",
  headers: {
    "X-Api-Version": "1.0.0",
  },
};

const fallbackClient = createClient(clientOptions);

export const apiClient = createClient2({
  ...clientOptions,
  fetch: async (input) => {
    const user = getStoredUser();

    // If the user is logged in, set the Authorization header
    if (user) input.headers.set("Authorization", `Bearer ${user.accessToken}`);

    const result = await fetch(input);

    // If the response is unauthorized, try to refresh the access token
    if (result.status === StatusCode.Unauthorized && user) {
      const { data, error, response } = await fallbackClient.request("get", "/auth/refresh");

      // If the refresh failed, clear the stored user
      if (response.status === StatusCode.Unauthorized) {
        setStoredUser(null);
        // Redirect to login page
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
        throw error;
      }

      // If the refresh was successful, update the stored user,
      // set the new access token in the headers and retry the original request
      if (data) {
        setStoredUser({ ...user, accessToken: data.accessToken });
        input.headers.set("Authorization", `Bearer ${data.accessToken}`);
        return fetch(input);
      }
    }

    return result;
  },
});

export const apiRequest = apiClient.request.bind(apiClient);
