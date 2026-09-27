"use client";

import type { PublicMemberDto } from "@gov-portal/shared";
import { BuildingsIcon, MapPinIcon, SealCheckIcon, StarIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type Dictionary, type Locale, localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The profile link, dressed as the outline button. Its `::after` stretches over
 * the card, so the whole card is the click target and `hover:` here fires
 * anywhere on it: the link turns primary, as in the design's Hover variant, and
 * so does keyboard focus. The `dark:` repeats outrank the outline variant's own
 * dark fills.
 *
 * The link must never be transformed. A transformed element becomes the
 * containing block of its own `::after`, so the button's 1px press nudge shrank
 * the overlay to the button mid-press, the release landed outside the link and
 * nothing opened. Press feedback lives on the card instead.
 */
const PROFILE_LINK = cn(
  buttonVariants({ variant: "outline", size: "sm" }),
  "transition-colors after:absolute after:inset-0 active:not-aria-[haspopup]:translate-none [-webkit-tap-highlight-color:transparent]",
  "hover:border-transparent hover:bg-primary hover:text-primary-foreground",
  "focus-visible:border-transparent focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:transition-none",
  "dark:hover:border-transparent dark:hover:bg-primary dark:focus-visible:border-transparent dark:focus-visible:bg-primary",
);

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Skill badges on one line; whatever does not fit collapses into a "+N more"
 * counter. The overflow is only hidden visually, so screen readers hear every
 * skill and skip the counter. The counter fades in rather than popping when
 * it first appears, which on server-rendered pages is just after hydration.
 */
function SkillsRow({ skills, moreLabel }: { skills: string[]; moreLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(skills.length);
  const overflow = skills.length - visible;

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    const counter = counterRef.current;
    if (!el || !counter) return;

    const compute = () => {
      const badges = Array.from(el.querySelectorAll<HTMLElement>("[data-skill]"));
      if (badges.length === 0) return;
      // clientWidth includes the row's inline padding; badges only get the content box.
      const style = getComputedStyle(el);
      const width =
        el.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      const gap = Number.parseFloat(style.columnGap) || 0;
      const counterWidth = counter.offsetWidth + gap;
      let used = 0;
      let fit = 0;
      for (let i = 0; i < badges.length; i++) {
        const badgeWidth = badges[i].offsetWidth + (fit > 0 ? gap : 0);
        const reserve = i < badges.length - 1 ? counterWidth : 0;
        if (used + badgeWidth + reserve > width) break;
        used += badgeWidth;
        fit++;
      }
      setVisible(fit);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [skills]);

  return (
    <div
      ref={containerRef}
      className="flex max-h-5 flex-wrap items-center gap-2 overflow-hidden px-4"
    >
      {skills.map((skill, i) => (
        <Badge
          key={skill}
          data-skill
          variant="secondary"
          className={cn(i < visible ? "" : "pointer-events-none absolute opacity-0")}
        >
          {skill}
        </Badge>
      ))}
      <Badge
        ref={counterRef}
        variant="secondary"
        aria-hidden
        className={cn(
          "transition-opacity duration-150 ease-out",
          overflow > 0 ? "" : "invisible absolute opacity-0",
        )}
      >
        +{overflow > 0 ? overflow : skills.length} {moreLabel}
      </Badge>
    </div>
  );
}

/**
 * A member in the directory or on the home page: avatar with the approved
 * seal, name and headline, organisation and location, skills, and a link to
 * the profile. Figma `Contributors Card` (Profilecard + Hover), DevNepal file,
 * node 386:34404.
 *
 * The whole card is the profile link. "View profile" stretches an overlay
 * across it, so hovering anywhere lifts the surface to `--popover` and turns
 * the button primary. Keyboard focus on the link does the same, without the
 * fade, and pressing settles the card to 99% (not under reduced motion). The
 * link's accessible name carries the member's name, so a list of links does
 * not read as a column of identical "View profile"s.
 */
export function MemberCard({
  member,
  dict,
  locale,
  featured = false,
  className,
}: {
  member: PublicMemberDto;
  dict: Dictionary;
  locale: Locale;
  /** Shows the "Featured" badge. The member data does not say who is featured yet. */
  featured?: boolean;
  className?: string;
}) {
  const profileHref = localePath(locale, `/members/${member.githubUsername}`);
  const avatarSrc = member.avatarUrl ?? `https://github.com/${member.githubUsername}.png`;
  const skills = useMemo(
    () => member.skills.map((skill) => dict.members.skillNames[skill]),
    [member.skills, dict],
  );

  return (
    <Card
      data-slot="profile-card"
      className={cn(
        "relative w-full gap-0 py-0 shadow-none ring-1 ring-border transition-[background-color,scale] duration-150 ease-out hover:bg-popover has-[:focus-visible]:bg-popover has-[:focus-visible]:transition-none motion-safe:active:scale-99",
        className,
      )}
    >
      <div className="flex flex-col gap-3.5 px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-3">
          <Avatar size="xl">
            {/* A late image fades in; Base UI skips the fade for one already cached. */}
            <AvatarImage
              src={avatarSrc}
              alt=""
              className="transition-opacity duration-200 ease-out data-starting-style:opacity-0"
            />
            <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
            <AvatarBadge className="bg-background text-primary ring-0">
              <SealCheckIcon weight="fill" aria-hidden />
            </AvatarBadge>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start gap-2">
              <p className="m-0 min-w-0 flex-1 truncate text-lg font-bold text-card-foreground">
                {member.displayName}
              </p>
              {featured ? (
                <Badge className="uppercase">
                  <StarIcon weight="fill" aria-hidden />
                  {dict.members.featured}
                </Badge>
              ) : null}
            </div>
            <p className="m-0 truncate text-sm font-medium text-muted-foreground">
              {member.headline ?? `@${member.githubUsername}`}
            </p>
          </div>
        </div>

        {member.affiliation || member.location ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground">
            {member.affiliation ? (
              <span className="flex items-center gap-1">
                <BuildingsIcon weight="fill" aria-hidden className="size-4 shrink-0" />
                {member.affiliation}
              </span>
            ) : null}
            {member.affiliation && member.location ? (
              <Separator
                orientation="vertical"
                aria-hidden
                className="data-vertical:h-2 data-vertical:self-center"
              />
            ) : null}
            {member.location ? (
              <span className="flex items-center gap-1">
                <MapPinIcon weight="fill" aria-hidden className="size-4 shrink-0" />
                {member.location}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {skills.length > 0 ? <SkillsRow skills={skills} moreLabel={dict.members.moreSkills} /> : null}

      {/* Pinned to the bottom, so cards stretched to one grid row line their buttons up. */}
      <div className="mt-auto p-4">
        <Link href={profileHref} className={PROFILE_LINK}>
          {dict.members.viewProfile}
          <span className="sr-only">: {member.displayName}</span>
        </Link>
      </div>
    </Card>
  );
}
