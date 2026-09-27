import { describe, expect, it } from "vitest";

import { withoutProfileClaims } from "@/server/session-token";

describe("withoutProfileClaims", () => {
  it("drops the GitHub name, email and avatar and keeps the member id", () => {
    const cleaned = withoutProfileClaims({
      name: "Example Member",
      email: "member@example.com",
      picture: "https://avatars.githubusercontent.com/u/1",
      sub: "1",
      memberId: "00000000-0000-4000-8000-000000000000",
    });

    expect(cleaned).toEqual({ sub: "1", memberId: "00000000-0000-4000-8000-000000000000" });
  });
});
