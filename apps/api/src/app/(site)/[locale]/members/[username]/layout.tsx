import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const title = `@${username}`;
  const description = `View ${username}'s approved public profile on Dev Nepal, including the details they chose to share.`;
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
