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
