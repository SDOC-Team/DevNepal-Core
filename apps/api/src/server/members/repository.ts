import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { type Member, members, type NewMember } from "@/db/schema";

export async function findById(id: string): Promise<Member | null> {
  const rows = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findByGithubId(githubId: number): Promise<Member | null> {
  const rows = await db.select().from(members).where(eq(members.githubId, githubId)).limit(1);
  return rows[0] ?? null;
}

export async function findByGithubUsername(username: string): Promise<Member | null> {
  const rows = await db
    .select()
    .from(members)
    .where(sql`lower(${members.githubUsername}) = ${username.toLowerCase()}`)
    .limit(1);
  return rows[0] ?? null;
}

export async function listDirectory(): Promise<Member[]> {
  return db
    .select()
    .from(members)
    .where(eq(members.status, "approved"))
    .orderBy(desc(members.priority), sql`${members.approvedAt} desc nulls last`);
}

export async function countApproved(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(members)
    .where(eq(members.status, "approved"));
  return rows[0]?.count ?? 0;
}

export async function listByStatus(status: Member["status"]): Promise<Member[]> {
  return db
    .select()
    .from(members)
    .where(eq(members.status, status))
    .orderBy(desc(members.priority), sql`${members.createdAt} asc`);
}

export async function insertMember(values: NewMember): Promise<Member | null> {
  const rows = await db
    .insert(members)
    .values(values)
    .onConflictDoNothing({ target: members.githubId })
    .returning();
  return rows[0] ?? null;
}

/**
 * GitHub usernames can be renamed and then claimed by someone else, so a
 * username stored for one member may now belong to another account. Moves any
 * other member off `username` to a placeholder. GitHub logins cannot start with
 * "-", so the placeholder never collides with a real login.
 */
export async function releaseUsername(username: string, keepGithubId: number): Promise<void> {
  await db
    .update(members)
    .set({ githubUsername: sql`'-stale-' || ${members.githubId}` })
    .where(
      and(
        sql`lower(${members.githubUsername}) = ${username.toLowerCase()}`,
        ne(members.githubId, keepGithubId),
      ),
    );
}

export async function updateMemberFields(
  id: string,
  values: Partial<Omit<NewMember, "id">>,
): Promise<Member | null> {
  if (Object.keys(values).length === 0) {
    return findById(id);
  }
  const rows = await db.update(members).set(values).where(eq(members.id, id)).returning();
  return rows[0] ?? null;
}

export async function listAll(): Promise<Member[]> {
  return db
    .select()
    .from(members)
    .orderBy(asc(members.status), desc(members.priority), asc(members.createdAt));
}
