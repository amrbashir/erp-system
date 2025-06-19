import createClient, { type ClientOptions } from "openapi-fetch";
import type { paths } from "./types.gen";

export function createApiClient(options?: ClientOptions) {
  return createClient<paths>(options);
}
