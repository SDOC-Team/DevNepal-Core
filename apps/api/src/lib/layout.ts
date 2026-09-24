/**
 * The one horizontal gutter every band of the page uses — sections, navbar,
 * masthead and footer — so their left and right edges line up exactly.
 * 16 / 32 / 64px.
 */
export const sectionGutter = "px-4 sm:px-8 lg:px-16";

/**
 * Gutter plus the vertical rhythm shared by every landing-page section:
 * 48px rising to 64px at `lg`. Apply as `cn(sectionPadding, "…")`.
 */
export const sectionPadding = `${sectionGutter} py-12 lg:py-16`;
