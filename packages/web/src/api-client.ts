import { createClient } from "@tech-zone-store/sdk";
import { getStoredUser, setStoredUser } from "./auth";

enum StatusCode {
  Unauthorized = 401,
}

const fallbackClient = createClient({ baseUrl: "/api/v1" });

export const apiClient = createClient({
  baseUrl: "/api/v1",
  fetch: async (input) => {
    const user = getStoredUser();

    // If the user is logged in, set the Authorization header
    if (user) input.headers.set("Authorization", `Bearer ${user.accessToken}`);

    const result = await fetch(input);

    // If the response is unauthorized, try to refresh the access token
    if (result.status === StatusCode.Unauthorized && user) {
      const { data } = await fallbackClient.request("get", "/auth/refresh");

      if (data) {
        // If the refresh was successful, update the stored user and set the new access token in the headers
        // and retry the original request with the new access token
        setStoredUser({ username: user?.username, accessToken: data.accessToken });
        input.headers.set("Authorization", `Bearer ${data.accessToken}`);
        return fetch(input);
      }
    }

    return result;
  },
});
