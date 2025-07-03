import createFetchClient from "openapi-fetch";

import type { ClientOptions as FetchClientOptions } from "openapi-fetch";

import type { paths } from "./schema";

export type ClientOptions = FetchClientOptions & {
  headers?: {
    "X-Api-Version"?: string;
  };
};

export function createClient(clientOptions?: ClientOptions) {
  return createFetchClient<paths>(clientOptions);
}

/**
 * Same as `createClient`, but `client.<method>` throws an error if the request fails.
 */
export function createThrowingClient(clientOptions?: ClientOptions) {
  const client = createClient(clientOptions);

  return {
    get: client.GET.bind(client),
    post: client.POST.bind(client),
    delete: client.DELETE.bind(client),
    request: client.request.bind(client),

    getThrowing: (async (path: any, options: any) => {
      const res = await client.GET(path, options);
      if (res.error) throw res.error;
      return res;
    }) as typeof client.GET,

    postThrowing: (async (path: any, options: any) => {
      const res = await client.POST(path, options);
      if (res.error) throw res.error;
      return res;
    }) as typeof client.POST,

    deleteThrowing: (async (path: any, options: any) => {
      const res = await client.DELETE(path, options);
      if (res.error) throw res.error;
      return res;
    }) as typeof client.DELETE,

    requestThrowing: (async (method: any, path: any, options: any) => {
      const res = await client.request(method, path, options);
      if (res.error) throw res.error;
      return res;
    }) as typeof client.request,
  };
}
