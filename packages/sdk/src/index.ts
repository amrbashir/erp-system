import type { paths } from "./schema";
import createFetchClient, { type ClientOptions } from "openapi-fetch";

export function createClient(clientOptions?: ClientOptions) {
  return createFetchClient<paths>(clientOptions);
}
