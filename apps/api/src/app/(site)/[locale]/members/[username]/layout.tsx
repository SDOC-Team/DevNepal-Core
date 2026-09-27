import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const title = `@${username}`;
  // Metadata is built from the URL alone, so it must not claim the profile
  // exists or is approved.
  const description = `Dev Nepal member profile for @${username}.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Dev Nepal`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} · Dev Nepal`,
      description,
    },
  };
}

export default function MemberDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
