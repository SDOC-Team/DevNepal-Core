import type { JWT } from "next-auth/jwt";

/**
 * Auth.js copies the GitHub name, email and avatar into the session token by
 * default. The session only needs the member id, so they are dropped.
 */
export function withoutProfileClaims(token: JWT): JWT {
  const cleaned = { ...token };
  delete cleaned.name;
  delete cleaned.email;
  delete cleaned.picture;
  return cleaned;
}
