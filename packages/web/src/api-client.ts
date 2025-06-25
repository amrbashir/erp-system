import { createClient, createClient2 } from "@erp-system/sdk";

import { getStoredUser, setStoredUser } from "@/auth/user";

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

const client = createClient2({
  ...clientOptions,
  fetch: async (input) => {
    const user = getStoredUser();

    // If the user is logged in, set the Authorization header
    if (user) input.headers.set("Authorization", `Bearer ${user.accessToken}`);

    const result = await fetch(input);

    const orgSlug = input.url.match(/\/org\/([^/]+)/)?.[1];

    // If the response is unauthorized, and requesting into specific org, try to refresh the access token
    if (result.status === StatusCode.Unauthorized && user && orgSlug) {
      const { data, error, response } = await fallbackClient.request(
        "get",
        "/org/{orgSlug}/auth/refresh",
        {
          // @ts-expect-error - incorrect type generation by openapi-typescript
          params: { path: { orgSlug } },
        },
      );

      // If the refresh failed, clear the stored user
      if (response.status === StatusCode.Unauthorized) {
        setStoredUser(null);
        // Redirect to login page
        window.location.href = `/org/${orgSlug}/login?redirect=${encodeURIComponent(window.location.href)}`;
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

// Export the API client with lowercase methods for convenience
export const apiClient = {
  get: client.GET.bind(client),
  post: client.POST.bind(client),
  put: client.PUT.bind(client),
  patch: client.PATCH.bind(client),
  delete: client.DELETE.bind(client),
  request: client.request.bind(client),
};
