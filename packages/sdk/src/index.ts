import type { paths } from "./schema";
import _createFetchClient, { type ClientOptions } from "openapi-fetch";
import _createReactQueryClient from "openapi-react-query";

export function createFetchClient(clientOptions?: ClientOptions) {
  return _createFetchClient<paths>(clientOptions);
}

export function createReactQueryClient(clientOptions?: ClientOptions) {
  return _createReactQueryClient(_createFetchClient<paths>(clientOptions));
}
