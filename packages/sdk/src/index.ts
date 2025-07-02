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

  const originalRequest = client.request;
  // @ts-ignore
  client.request = async (method: any, path: any, options: any) => {
    const res = await originalRequest(method, path, options);
    // @ts-ignore
    if (res.error) throw res.error;
    return res;
  };

  const originalGET = client.GET;
  // @ts-ignore
  client.GET = async (path: any, options: any) => {
    const res = await originalGET(path, options);
    // @ts-ignore
    if (res.error) throw res.error;
    return res;
  };

  const originalPOST = client.POST;
  // @ts-ignore
  client.POST = async (path: any, options: any) => {
    const res = await originalPOST(path, options);
    // @ts-ignore
    if (res.error) throw res.error;
    return res;
  };

  const originalDELETE = client.DELETE;
  // @ts-ignore
  client.DELETE = async (path: any, options: any) => {
    const res = await originalDELETE(path, options);
    // @ts-ignore
    if (res.error) throw res.error;
    return res;
  };

  return client;
}
