/**
 * A member's stored GitHub username is released to this prefix plus their
 * GitHub id when another account claims the name. GitHub logins cannot start
 * with "-", so the placeholder never collides with a real login. It is replaced
 * with the member's current login on their next sign-in.
 */
export const RELEASED_USERNAME_PREFIX = "-stale-";

export function isReleasedUsername(username: string): boolean {
  return username.startsWith(RELEASED_USERNAME_PREFIX);
}
