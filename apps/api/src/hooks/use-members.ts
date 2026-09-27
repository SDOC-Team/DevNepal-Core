import type { Member } from "@gov-portal/api-client";
import useSWR, { useSWRConfig } from "swr";

import { apiClient } from "@/lib/api-client";

/** Full public member directory (no filters — filtering happens client-side). */
export function useMembers() {
  const { data, error, isLoading } = useSWR<Member[]>("/v1/members", () => apiClient.listMembers());
  return {
    members: data ?? [],
    isLoading,
    error: error as Error | undefined,
  };
}

/**
 * A single public member profile by GitHub username. Arriving from the
 * directory, the cached list already holds this member, so the profile shows
 * straight away and revalidates in the background instead of opening on a
 * skeleton.
 */
export function useMember(username: string | undefined) {
  const { cache } = useSWRConfig();
  const listed =
    username === undefined
      ? undefined
      : (cache.get("/v1/members")?.data as Member[] | undefined)?.find(
          (member) => member.githubUsername === username,
        );
  const fetchMember = username === undefined ? null : () => apiClient.getMember(username);
  const { data, error, isLoading } = useSWR<Member>(
    username !== undefined ? `/v1/members/${encodeURIComponent(username)}` : null,
    fetchMember,
    { fallbackData: listed },
  );
  return {
    member: data,
    // SWR keeps `isLoading` true while it revalidates fallback data.
    isLoading: isLoading && data === undefined,
    error: error as Error | undefined,
  };
}
