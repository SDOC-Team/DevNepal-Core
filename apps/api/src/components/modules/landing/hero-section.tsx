import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { sectionPadding } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { HeroDataViz } from "./hero-data-viz";
import { HeroSignIn } from "./hero-sign-in";
import { NepalMap } from "./nepal-map";

export function HeroSection({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section
      data-slot="home-hero"
      className={cn(
        sectionPadding,
        "relative isolate flex flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between",
      )}
    >
      {/* Nepal as a feathered field of blueprint grid across the hero — static. */}
      <NepalMap className="pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black_40%,transparent_92%)] text-border" />

      <div className="flex max-w-xl flex-col justify-center gap-6">
        <div className="flex flex-col gap-5">
          <h1 className="text-5xl font-bold tracking-[-0.02em] text-foreground lg:text-6xl">
            <span className="block">{dict.home.titleLine1}</span>
            <span className="block">{dict.home.titleLine2}</span>
          </h1>
          <p className="text-base text-pretty text-secondary-foreground">{dict.home.lead}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <HeroSignIn label={dict.session.signIn} locale={locale} />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href={localePath(locale, "/issues")} />}
          >
            {dict.home.browseIssues}
          </Button>
        </div>
      </div>
      <HeroDataViz className="w-full lg:max-w-3xl" />
    </section>
  );
}
