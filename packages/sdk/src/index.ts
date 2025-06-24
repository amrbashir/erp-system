import type { paths } from "./schema";
import createFetchClient, { type ClientOptions as FetchClientOptions } from "openapi-fetch";

export type ClientOptions = FetchClientOptions & {
  headers?: {
    "X-Api-Version"?: string;
  };
};

export function createClient(clientOptions?: ClientOptions) {
  return createFetchClient<paths>(clientOptions);
}

/**
 * Same as `createClient`, but `client.request` throws an error if the request fails.
 */
export function createClient2(clientOptions?: ClientOptions) {
  const client = createClient(clientOptions);

  const originalRequest = client.request;
  // @ts-ignore
  client.request = async (method: any, path: any, options: any) => {
    const res = await originalRequest(method, path, options);
    // @ts-ignore
    if (res.error) throw res.error;
    return res;
  };

  return client;
}
