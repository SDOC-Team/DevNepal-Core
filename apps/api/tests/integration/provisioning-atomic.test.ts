import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/members/repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/members/repository")>();
  return { ...actual, updateMemberFields: vi.fn(actual.updateMemberFields) };
});

import { findById, updateMemberFields } from "@/server/members/repository";
import { ensureMemberFromGithubLogin } from "@/server/members/service";

import { resetDatabase } from "../helpers/db";

describe("username release", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("is rolled back when taking the name fails", async () => {
    const holder = await ensureMemberFromGithubLogin({
      githubId: 810001,
      githubUsername: "contested",
      displayName: "Current Holder",
      avatarUrl: null,
    });
    await ensureMemberFromGithubLogin({
      githubId: 810002,
      githubUsername: "renaming",
      displayName: "Renaming Member",
      avatarUrl: null,
    });
    vi.mocked(updateMemberFields).mockRejectedValueOnce(new Error("update failed"));

    await expect(
      ensureMemberFromGithubLogin({
        githubId: 810002,
        githubUsername: "contested",
        displayName: "Renaming Member",
        avatarUrl: null,
      }),
    ).rejects.toThrow("update failed");

    expect((await findById(holder.id))?.githubUsername).toBe("contested");
  });
});
