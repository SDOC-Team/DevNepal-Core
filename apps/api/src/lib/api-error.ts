import { ApiError } from "@gov-portal/api-client";

export { ApiError };

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
